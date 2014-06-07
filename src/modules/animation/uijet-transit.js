(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/mixins/Transitioned'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(this, function (uijet) {

    /**
     * uijet-transit animation module.
     * 
     * @module animation/uijet-transit
     * @category Module
     * @sub-category Animation
     * @extends uijet
     */
    var requestAnimFrame = uijet.utils.requestAnimFrame,
        getStyle = uijet.utils.getStyle,
        // get the Transitioned mixin
        transitioned = uijet.Mixin('Transitioned'),
        duration_re = /([\.\d]+)(ms|s)/,
        _parseDuration = function (duration) {
            var match = duration.match(duration_re),
                multiplier = 1, res;
            if ( match ) {
                if ( match[2] == 's' ) {
                    multiplier = 1000;
                }
                res = +match[1] * multiplier;
            }
            return (match && res) || 16;
        };

    /**
     * Extends the Transitioned mixin to leverage this
     * animation module.
     * 
     * @name animation/uijet-transit.Transitioned
     * @extends Transitioned
     */
    uijet.utils.extend(transitioned, {
        /**
         * Initializes the instance's element state to the out-of-view
         * state and optionally (and by default) turns hardware acceleration on
         * on transitions of this instance.
         * 
         * #### Signals:
         * 
         * * `pre_prepareelement`: triggered at the beginning of this method.
         * 
         * #### Related options:
         * 
         * * `animation_type`: the type of animation to use for the transition.
         * * `dont_promote`: whether to prevent promotion of this element to its own layer, aka hardware acceleration.
         * 
         * @memberOf animation/uijet-transit.Transitioned
         * @instance
         * @returns {Transitioned}
         */
        prepareElement  : function () {
            this.notify(true, 'pre_prepareelement');
            // initially set the `<animation_type>_out` `class`
            var class_name = (this.options.animation_type || uijet.options.animation_type) + '_out';
            // if not disabled, promote this element to it's own layer which enables hardware acceleration
            if ( ! this.options.dont_promote ) {
                class_name += ' promoted';
            }

            this.$element.addClass(class_name);

            this._super();
            return this;
        },
        /**
         * Applies transition out of view.
         * 
         * @memberOf animation/uijet-transit.Transitioned
         * @instance
         * @param {boolean} [no_transitions] - whether to suppress the animation.
         * @returns {transitioned}
         */
        disappear       : function (no_transitions) {
            var that = this,
                // caching super method for calling it later inside an async function
                _super = this._super,
                $el = this.$wrapper || this.$element,
                // store the animation callback
                _success = function () {
                    // make invisible
                    that._setCloak(true);
                    // clear classes related to active state
                    $el.removeClass('current reverse');
                    _super.call(that, no_transitions);
                };
            this.notify(true, 'pre_disappear');
            if ( no_transitions ) {
                // in case we want to hide the widget without animation just fire the callback
                _success();
            }
            else {
                // transit out
                this.transit('out').then(_success, function () {
                    // make sure we unbind the transition-end event handler
                    $el.off(uijet.support.transitionend);
                });
            }
            return this;
        },
        /**
         * Applies `prepareElement()` of this module on `this.$wrapper`.
         * 
         * @memberOf animation/uijet-transit.Transitioned
         * @instance
         * @returns {Transitioned}
         * @private
         */
        _wrap           : function () {
            // cache the  `<animation_type>_out` `class`
            var class_name = (this.options.animation_type || uijet.options.animation_type) + '_out';
            if ( ! this.options.dont_promote ) {
                class_name += ' promoted';
            }
            // do wrapping
            this._super();
            // add this class to the `$wrapper`
            this.$wrapper.addClass(class_name);
            // and remove it from the `$element`
            this.$element.removeClass(class_name);
            return this;
        }
    });

    uijet.use({
        /**
         * #### Animation types:
         * 
         * * `fold`: folds the element's height from 0 to full height.
         * 
         * @member {Object} module:animation/uijet-transit.special_animations
         */
        special_animations  : {
            fold: function (widget, is_in) {
                var $el = widget.$wrapper || widget.$element, _h;
                if ( is_in ) {
                    _h = widget._total_height || 0;
                    if ( ! _h ) {
                        // calculate total height
                        Array.prototype.reverse.call($el.children()).each(function () {
                            var el_bottom = this.offsetTop + this.offsetHeight + (+getStyle(this, 'margin-bottom').slice(0, -2));
                            if ( el_bottom > _h ) {
                                _h = el_bottom;
                            }
                        });
                    }
                    if ( ! _h ) {
                        _h = $el[0].offsetParent.offsetHeight - $el[0].offsetTop;
                    }
                    // unfold
                    this.animate($el, { height : _h + 'px' });
                } else {
                    // fold
                    this.animate($el, { height : '0px' });
                }
                return uijet.support.transitionend;
            }
        },
        /**
         * Transitions a widget's element into or out of view.
         * 
         * #### Related options:
         * 
         * * `animation_type`: type of animation to use. Defaults to `uijet.options.animation_type` which defaults to `fade`.
         * 
         * @memberOf module:animation/uijet-transit
         * @param {Widget} widget - the widget instance to transition.
         * @param {string} [direction] - direction of transition - `'in'` or `'out'`. Defaults to `'in'`.
         * @param {function} [callback] - callback to invoke at end of transition.
         * @returns {uijet}
         */
        transit             : function (widget, direction, callback) {
            var transit_type = widget.options.animation_type || this.options.animation_type,
                $el = (widget.$wrapper || widget.$element),
                class_name = transit_type + '_in',
                transitioned_class = 'transitioned',
                // cache the handler since we might need to call it explicitly
                transitionendHandler = function (e) {
                    if ( uijet.back_navigation === false ) {
                        $el.removeClass('transitioned reverse');
                        delete uijet.back_navigation;
                    } else {
                        $el.removeClass(transitioned_class);
                    }
                    callback && callback.call(widget);
                },
                trans_end_event = uijet.support.transitionend,
                is_direction_in, has_class_name;

            direction = direction || 'in';
            is_direction_in = direction == 'in';

            if ( uijet.back_navigation ) {
                uijet.back_navigation = false;
                $el.addClass('reverse');
            }
            // bind just one event listener to the end of the animation
            trans_end_event && $el.one(trans_end_event, transitionendHandler);
            // Check for a special case animation handler
            if ( transit_type in this.special_animations ) {
                var end = this.special_animations[transit_type].call(this, widget, is_direction_in);
                // if transitionend event is not supported assuming there's no transition
                (end === false || ! trans_end_event) && requestAnimFrame(transitionendHandler);
            }
            else {
                has_class_name = $el.hasClass(class_name);
                // if we're transitioning the element in and it's already in OR
                // transitioning out and it's already out
                if ( has_class_name === is_direction_in ) {
                    // just call the handler since the transition won't take place
                    transitionendHandler();
                }
                // otherwise do the animation
                else {
                    this['animation_id_' + widget.id] = requestAnimFrame(function () {
                        $el.addClass(transitioned_class).toggleClass(class_name, is_direction_in);
                    });
                }
            }
            return this;
        },
        /**
         * Animates an elements' properties.
         * 
         * @memberOf module:animation/uijet-transit
         * @param {HTMLElement[]} $el - wrapped HTMLElement to animate.
         * @param {string|Object} props - valid CSS text to set on the element's style, or a map of style properties.
         * @param {function} [callback] - callback to run at the end of the animation.
         * @returns {Array} - ids of the animation frames requested for this animation + callback.
         */
        animate             : function ($el, props, callback) {
            var trans_end_event = uijet.support.transitionend,
                have_callback = typeof callback == 'function',
                handles = [];
            $el.addClass('transitioned');
            have_callback && trans_end_event && $el.one(trans_end_event, callback);
            handles.push(requestAnimFrame(function () {
                var style = $el[0].style, p, duration, delay;
                if ( typeof props == 'string' )
                    style.cssText = props;
                else
                    for ( p in props )
                        if (p in style)
                            style[p] = props[p];
                        else
                            style.setProperty(p, props[p]);

                // if there's a callback to trigger and no end event support
                if ( have_callback && ! trans_end_event ) {
                    //TODO: check if this works consistently across platforms, and when set individually or with shorthand
                    duration = uijet.utils.getStyleProperty('transition-duration');
                    delay = uijet.utils.getStyleProperty('transition-delay');
                    handles.push(setTimeout(callback, _parseDuration(duration) + _parseDuration(delay)));
                }
            }));
            return handles;
        }
    }, uijet);
}));
