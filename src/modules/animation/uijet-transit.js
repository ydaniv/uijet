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
    function isFunc (obj) {
        return typeof obj == 'function';
    }
    var requestAnimFrame = uijet.utils.requestAnimFrame,
        getStyle = uijet.utils.getStyle,
        // get the Transitioned mixin
        transitioned = uijet.Mixin('Transitioned');

    // add methods to the Transitioned mixin that will init the animation state with the `<type>_out` class
    // on the top element
    uijet.utils.extend(transitioned, {
        prepareElement  : function () {
            this.notify(true, 'pre_prepareelement');
            // initialy set the __animation_type_out__ `class`
            this.$element.addClass((this.options.animation_type || uijet.options.animation_type) + '_out');
            // if not disabled, promote this element to it's own layer which enables hardware acceleration
            if ( ! this.options.dont_promote ) {
                this.$element.addClass('promoted');
            }
            this._super();
            return this;
        },
        _wrap           : function () {
            // cache the __animation_type_out__ `class`
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
        },
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
        }
    });

    uijet.use({
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
        // ## uijet.transit
        // @sign: transit(widget, direction, callback)  
        // @return: uijet
        //
        // Handles widgets animation across the appliaction.  
        // Mostly transitions of widgets in and out of the view.  
        // Takes a widget to transition, a direction ("in"/"out") of the animation
        // and a callback to fire once the animation is done.  
        // This callback will usually resolve a promise waiting for the animation to end.
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
        animate             : function ($el, props, callback) {
            var trans_end_event = uijet.support.transitionend,
                have_callback = isFunc(callback),
                request_id;
            $el.addClass('transitioned');
            have_callback && trans_end_event && $el.one(trans_end_event, callback);
            request_id = requestAnimFrame(function () {
                var style = $el[0].style, p;
                if ( typeof props == 'string' )
                    style.cssText = props;
                else
                    for ( p in props )
                        if (p in style)
                            style[p] = props[p];
                        else
                            style.setProperty(p, props[p]);
            });
            if ( ! trans_end_event ) {
                request_id = have_callback && requestAnimFrame(callback);
            }
            return request_id;
        }
    }, uijet);
}));
