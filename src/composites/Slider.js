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
    uijet.Widget('Slider', {
        options : {
            type_class  : 'uijet_slider',
            style       : {
                position: 'relative'
            }
        },
        register: function () {
            this._super.apply(this, arguments);

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
                handle_ops.element = uijet.$('<span/>').appendTo(this.$element);
            }

            handle_ops.mixins = uijet.utils.putMixin(handle_ops.mixins, 'Dragged', 0);

            handle_app_events[this.id + '.update_ui'] = function (position) {
                var deltas = {};
                deltas[vertical ? 'top' : 'left'] = position;
                this.drag(this.$element[0], deltas, true);
            };

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

            // start button
            uijet.start({
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
            this._handle_size = this.$element.find('.uijet_slider_handle')[0][vertical ? 'offsetHeight' : 'offsetWidth'];
            this.slide(initial, false, true);

            return this;
        },
        //TODO: add docs
        slide   : function (value, dont_update_ui, dont_publish) {
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
        //TODO: add docs
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
        //TODO: add docs
        _valueToPosition: function (value) {
            var percent = (value - this.slider_min) / (this.slider_max - this.slider_min),
                size = +uijet.utils.getStyle(
                    this.$element[0],
                    this.options.vertical ? 'height' : 'width'
                ).slice(0, -2) - (this._handle_size || 0);
            return (percent * size) | 0;
        },
        //TODO: add docs
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
