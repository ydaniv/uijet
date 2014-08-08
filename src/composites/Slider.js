(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Button',
            'uijet_dir/mixins/Dragged'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Slider composite class.
     *
     * @class Slider
     * @extends BaseWidget
     * @category Composite
     */
    uijet.Widget('Slider', {
        options: {
            type_class  : 'uijet_slider',
            style       : {
                position: 'relative'
            }
        },
        /**
         * Initializes options, starts the Slider's handle Button and
         * slides it to its initial position.
         *
         * #### Related options:
         *
         * * `handle`: the config object of the handle Button widget.
         * * `initial`: initial value to set the slider to.
         * * `vertical`: whether this is a vertical slider.
         * * `min`: minimal value for the slider.
         * * `max`: maximal value for the slider.
         * * `step`: interval value of each step between min to max.
         *
         * @methodOf Slider
         * @returns {Slider}
         */
        initContained   : function () {
            var options = this.options,
                handle_ops = options.handle || {},
                initial = +options.initial,
                vertical = this.options.vertical,
                slider = this,
                handle_app_events = {};

            this.slider_min = +options.min || 0;
            this.slider_max = +options.max || (options.max === 0 ? 0 : 100);
            // set step
            this.slider_step = +options.step || 1;
            this.slider_step = this.slider_step > 0 ? this.slider_step : 1;
            // set initial value or minimal value
            initial = initial || (initial === 0 ? 0 : this.slider_min);

            //TODO: add support for a double-handle slider
            // set some button defaults
            if ( ! handle_ops.element ) {
                handle_ops.element = uijet.$('<span>').appendTo(this.$element);
            }

            // make sure handle Button has Dragged mixin at the bottom of the list
            handle_ops.mixins = uijet.utils.putMixin(handle_ops.mixins, 'Dragged', 0);

            // register handle Button to the `<id>.update_ui` event and update its position
            handle_app_events[this.id + '.update_ui'] = function (position) {
                var deltas = {};
                deltas[vertical ? 'top' : 'left'] = position;
                this.drag(this.$element[0], deltas, true);
            };

            // make sure the Slider is listening to a click event that will cause a slide to clicked point
            if ( ! (uijet.support.click_events.full in this.options.dom_events) ) {
                this.options.dom_events[uijet.support.click_events.full] = function (e) {
                    if ( e.target === this.$element[0] ) {
                        var event_pos = uijet.support.touch ? e.originalEvent.touches[0] : e,
                            //TODO: replace getting offset with a simpler cache-based method that reduces reflow caused by checking offset
                            position = event_pos[vertical ? 'pageY' : 'pageX'] - uijet.utils.getOffsetOf(e.target, document.documentElement)[vertical ? 'y' : 'x'],
                            value = this._positionToValue(position - this._handle_size / 2);
                        this.slide(value);
                    }
                };
            }

            // add the handle Button to components
            options.components.unshift({
                type    : 'Button',
                config  : uijet.utils.extend(true, {
                    type_class      : ['uijet_button', 'uijet_slider_handle'],
                    style           : {
                        position: 'absolute'
                    },
                    id              : slider.id + '_handle',
                    container       : slider.id,
                    drag_parent     : slider.$element[0],
                    drag_axis       : vertical ? 'Y' : 'X',
                    dont_translate  : true,
                    keep_position   : true,
                    drag_contain    : true,
                    dragover_handler: function (e, delta) {
                        var position = delta[vertical ? 'top' : 'left'];
                        slider.slide(slider._positionToValue(position), true);
                    },
                    app_events      : handle_app_events
                }, handle_ops)
            });

            var res = this._super.apply(this, arguments);

            // cache the handle's size
            this._handle_size = this.$element.find('.uijet_slider_handle')[0][vertical ? 'offsetHeight' :
                                                                              'offsetWidth'];
            // slide handle to initial position
            this.slide(initial, false, true);

            return res;
        },
        /**
         * Sets the `slider_value` property of the instance and updates UI, e.g.
         * the handle's position.
         *
         * @methodOf Slider
         * @param {number} value - a value to set the slider to.
         * @param {boolean} [dont_update_ui] - whether to NOT update the handle's position. Defaults to `false`.
         * @param {boolean} [dont_publish] - whether to NOT publish the `<id>.changed` event. Defaults to `false`.
         */
        slide  : function (value, dont_update_ui, dont_publish) {
            // step & value calculation taken from jQueryUI's slider
            // https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.slider.js#L559
            var step = this.slider_step,
                value = this._trimValue(value),
                value_mod_step = value % step,
                align_value = value - value_mod_step;

            if ( (value_mod_step | 0) * 2 >= step ) {
                align_value += ( value_mod_step > 0 ) ? step : -step;
            }

            // Since JavaScript has problems with large floats, round
            // the final value to 5 digits after the decimal point
            this.slider_value = parseFloat(align_value.toFixed(5));

            if ( ! dont_publish ) {
                this.publish('changed', this.slider_value);
            }

            if ( ! dont_update_ui ) {
                this.publish('update_ui', this._valueToPosition(this.slider_value));
            }
        },
        /**
         * Ensures `value` is between `max` and `min`.
         *
         * @methodOf Slider
         * @param {number} value - number to trim.
         * @returns {Slider}
         * @private
         */
        _trimValue      : function (value) {
            value = +value;
            if ( value > this.options.max ) {
                return this.options.max;
            }
            else if ( value < this.options.min ) {
                return this.options.min
            }
            return value;
        },
        /**
         * Converts a given value into a position of the handle in pixels.
         *
         * @methodOf Slider
         * @param {value} value - value on the slider to convert to a position of the handle.
         * @returns {number} - a position, in pixels, on the slider, corresponding to given `value`.
         * @private
         */
        _valueToPosition: function (value) {
            var percent = (value - this.slider_min) / (this.slider_max - this.slider_min),
                size = +uijet.utils.getStyle(
                    this.$element[0],
                    this.options.vertical ? 'height' : 'width'
                ).slice(0, -2) - (this._handle_size || 0);
            return (percent * size) | 0;
        },
        /**
         * Converts a given position in pixels on the slider to a valid value.
         *
         * @methodOf Slider
         * @param {number} position - a position on the slider in pixels.
         * @returns {number} - a valid value of the slider, corresponding to a given position on the slider.
         * @private
         */
        _positionToValue: function (position) {
            var size = +uijet.utils.getStyle(
                    this.$element[0],
                    this.options.vertical ? 'height' : 'width'
                ).slice(0, -2) - (this._handle_size || 0),
                percent = position / size;
            return (this.slider_max - this.slider_min) * percent + this.slider_min;
        }
    });
}));
