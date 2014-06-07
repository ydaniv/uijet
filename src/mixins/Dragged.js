(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    var has_touch = uijet.support.touch,
        requestAnimFrame = uijet.utils.requestAnimFrame,
        cancelAnimFrame = uijet.utils.cancelAnimFrame,
        // get the prefixed `transform` property
        style_prop = uijet.utils.getStyleProperty('transform'),
        translation_re = /translate(?:X|Y|Z|3d)?\(([^\)]+)\)/,
        _dragHandler = function (el, deltas, force_move, use_translate) {
            //TODO: make the animation property value (translate, etc.) as a return value of a generic method of uijet
            var horizontal, property, trans, px = 'px';
            if ( this.dragging || force_move ) {
                //TODO: this will override other transforms  
                // if `axis` is set then animate only along that axis
                if ( this._drag_axis ) {
                    horizontal = that._drag_axis === 'X';

                    if ( use_translate ) {
                        trans = horizontal ? deltas.dx : deltas.dy;
                        el.style[style_prop] = 'translate' + this._drag_axis + '(' + trans + 'px)';
                    }
                    else {
                        property = horizontal ? 'left' : 'top';
                        el.style[property] = deltas[property] + px;
                    }
                }
                else {
                    if ( use_translate ) {
                        trans = deltas.dx + 'px,' + deltas.dy + px;
                        el.style[style_prop] = uijet.support['3d'] ?
                            'translate3d(' + trans + ',0)' :
                            'translate(' + trans + ')';
                    }
                    else {
                        el.style.top = deltas.top + px;
                        el.style.left = deltas.left + px;
                    }
                }
            }
        };

    /**
     * Dragged mixin class.
     * 
     * @mixin Dragged
     * @category Mixin
     * @extends BaseWidget
     */
    uijet.Mixin('Dragged', {
        dragged             : true,
        /**
         * Initializes options related to dragging.
         * 
         * #### Related options:
         * 
         * * `dont_translate`: if `true` uijet will use `top`/`left` style attributes instead of `transform:translate`.
         * * `keep_position`: whether to keep the dragged element's position after drop.
         * 
         * @memberOf Dragged
         * @instance
         * @returns {Dragged}
         */
        init                : function () {
            this._super.apply(this, arguments);

            var cached_styles = ['width', 'height'],
                use_translate = uijet.support.transform && ! this.options.dont_translate,
                clear_position = ! this.options.keep_position;

            this._use_translate = use_translate;
            // handle the cached style properties
            if ( use_translate ) {
                cached_styles.push('top', 'left');
                if ( clear_position ) {
                    cached_styles.push(style_prop);
                }
            }
            else if ( clear_position ) {
                cached_styles.push('top', 'left');
            }
            this._cached_drag_styles = cached_styles;
            return this;
        },
        /**
         * Binds the drag handler, unless the `dont_auto_drag`
         * option is `true`.
         * 
         * #### Related options:
         * 
         * * `dont_auto_drag`: if `true` the drag handler will not be automatically bound.
         * 
         * @memberOf Dragged
         * @instance
         * @returns {Dragged}
         */
        appear              : function () {
            var options = this.options;
            this._super.apply(this, arguments);
            if ( ! options.dont_auto_drag ) {
                this.bindDrag(options.dragover_handler, options.drag_axis);
            }
            return this;
        },
        /**
         * Unbinds the drag handler, unless the `dont_auto_drag`
         * option is `true`.
         * 
         * #### Related options:
         * 
         * * `dont_auto_drag`: if `true` the drag handler will not be unbound automatically.
         * 
         * @memberOf Dragged
         * @instance
         * @returns {Dragged}
         */
        disappear           : function () {
            if ( ! this.options.dont_auto_drag ) {
                this.unbindDrag();
            }
            this._super.apply(this, arguments);
            return this;
        },
        /**
         * Binds the dragstart handler to the event that will trigger
         * the drag start, according to touch support.
         * 
         * @memberOf Dragged
         * @instance
         * @param {function} [over_callback] - a custom handler for handling `dragover`.
         * @param {string} [axis] - locks dragging to occur only along the specified axis.
         * @returns {Dragged}
         */
        bindDrag            : function (over_callback, axis) {
            // get the element used for starting drag
            var $drag_element = this._getDragElement(),
                // get the top container of the widget
                $el = (this.$wrapper || this.$element);
            this._drag_axis = axis;
            this._dragover_callback = over_callback;
            // cache the bound handler to be able to remove specifically it later
            this._dragstart_handler = this._startHandler.bind(this);
            // set the start event on the drag_element, if set, or the top container
            ($drag_element && $drag_element.length ? $drag_element : $el).one(uijet.support.click_events.start, this._dragstart_handler);
            return this;
        },
        /**
         * Unbinds the dragstart handler from the event that will trigger
         * the drag start, according to touch support.
         * 
         * @memberOf Dragged
         * @instance
         * @returns {Dragged}
         */
        unbindDrag          : function () {
            // get the element used for starting drag
            var $drag_element = this._getDragElement(),
            // get the top container of the widget
                $el = (this.$wrapper || this.$element);
            // remove the set handler
            ($drag_element && $drag_element.length ? $drag_element : $el).off(uijet.support.click_events.start, this._dragstart_handler);
            return this;
        },
        /**
         * Handler for the drag start event.
         * 
         * #### Related options:
         * 
         * * `drag_delay`: amounts of milliseconds to wait before actually starting the drag. Defaults to `150`.
         * * `drag_clone`: whether to clone the dragged element. Useful for "copying" operations.
         * * `drag_parent`: query selector for the element that will be used to contain the dragging action.
         * * `drag_once`: if `true` the drag start handler will not be automatically re-bound.
         * * `drag_contain`: if `true` then dragging will only be allowed inside the parent element of the draggee.
         * 
         * #### Signals:
         * 
         * * `pre_drag_init`: triggered after drag event was triggered but before preconditions for dragging (i.e. delay) were met.
         * . Takes start event object, the wrapped draggee element, and the start position object as `{x, y, left, top}`.
         * * `pre_drag_start`: triggered before dragging is started but after preconditions for dragging (i.e. delay) were met.
         * Takes start event object and the wrapped draggee element.
         * * `post_drag_start`: triggered after dragging started. Takes start event object and the wrapped draggee element.
         * * `post_drag_end`: triggered after drop. Takes the drop event object, the end position object as
         * `{x, y, dx, dy}`, and the wrapped draggee element.
         * 
         * @memberOf Dragged
         * @instance
         * @param {Object} down_e - drag start event object, e.g. `mousedown`, `touchstart`.
         * @private
         */
        _startHandler       : function (down_e) {
            var that = this,
                // get the top container of the widget
                $el = (this.$wrapper || this.$element),
                el = $el[0],
                // set the delay in ms
                delay = this.options.drag_delay || 150,
                is_cloned = this.options.drag_clone,
                // get the start event object  
                //TODO: this is adapted for iOS touch event object handling, need to test/implement the rest
                down_pos = has_touch ? down_e.originalEvent.touches[0] : down_e,
                offset = uijet.utils.getOffsetOf(el, this.options.drag_parent || uijet.$element[0]),
                // set position
                start_position = {
                    y   : down_pos.pageY,
                    x   : down_pos.pageX,
                    top : offset.y,
                    left: offset.x
                },
                $doc = uijet.$(document),
                dfrd = uijet.Promise(),
                start_time = down_e.timeStamp,
                initial_translation,
                _finally, delayHandler, cancelHandler,
                MOVE_E, END_E, $draggee, draggee;

            // must prevent default action here to prevent selection and prevent event trickling on iOS
            down_e.preventDefault();

            if ( this._use_translate ) {
                initial_translation = el.style[style_prop];
                initial_translation && (initial_translation = initial_translation.match(translation_re));
                if ( initial_translation ) {
                    initial_translation = initial_translation[1].split(',');
                    if ( this._drag_axis ) {
                        start_position[this._drag_axis.toLowerCase()] += (+initial_translation[0].slice(0, -2) || 0);
                    }
                    else {
                        start_position.x += (+initial_translation[0].slice(0, -2) || 0);
                        start_position.y += (+initial_translation[1].slice(0, -2) || 0);
                    }
                }
            }

            // get the scrolled parent of this element
            this._scrolled_parent = this._getScrolledParent(el);
            this._initial_scroll = {
                y   : this._scrolled_parent.scrollTop,
                x   : this._scrolled_parent.scrollLeft
            };
            // cache the events names
            MOVE_E = uijet.support.click_events.move;
            END_E = uijet.support.click_events.end;
            if ( is_cloned ) {
                // clone if required to
                $draggee = $el.clone();
            }
            // if not cloned
            else {
                // the draggee is the element itself
                $draggee = $el;
            }
            draggee = $draggee[0];

            // a lambda for checking if the set delay time has passed
            delayHandler = function (move_e) {
                if ( move_e.timeStamp - start_time >= delay ) dfrd.resolve();
            };
            // a callback for canceling the drag
            cancelHandler = function (up_e) {
                // if the end event was fired before the delay
                if ( up_e && dfrd.state() === 'pending' && up_e.timeStamp - start_time < delay ) {
                    // cancel the drag
                    dfrd.reject();
                } else {
                    // remove the move and end handlers
                    $doc.off(MOVE_E, delayHandler)
                        .off(END_E, cancelHandler);
                }
            };
            // a callback to clean up
            _finally = function () {
                // set again as draggable unless requested not to
                that.options.drag_once || that.bindDrag(that._dragover_callback, that._drag_axis);
            };

            // confine the dragging to the primary mouse button or touch
            if ( has_touch || down_pos.which === 1 ) {
                // notify user of drag start event - before dragging conditions (e.g. drag_delay) are met
                this.notify('pre_drag_init', down_e, $draggee, start_position);
                // in this stage we're just checking if this is really a case of dragging  
                // bind the move event to the delay-check handler
                $doc.on(MOVE_E, delayHandler)
                    // and a single drag end to the cancel handler
                    .one(END_E, cancelHandler);
                // if passed delay test activate draggable state
                dfrd.promise().then(function () {
                    var continue_drag, moveHandler, endHandler;
                    that.dragging = true;
                    // remove the delay test handlers
                    cancelHandler();
                    // notify user drag is about to start
                    continue_drag = that.notify('pre_drag_start', down_e, $draggee);
                    // bail out
                    if ( typeof continue_drag == 'boolean' ) {
                        // if `true` re-bind drag, otherwise bind on a basis of drag_once option
                        continue_drag ? that.bindDrag(that._dragover_callback, that._drag_axis) : _finally();
                        return;
                    }
                    if ( is_cloned ) {
                        el = draggee;
                    }
                    else {
                        // if dragging the original cache its old style
                        that._cacheStyle(draggee);
                    }
                    // prepare the visual draggee
                    that._initdraggee($el, is_cloned && $draggee);
                    // notify user drag is started
                    that.notify('post_drag_start', down_e, $draggee);
                    // define the drag move handler
                    moveHandler = function (move_e) {
                        // get the move event object
                        var move_pos = has_touch ? move_e.originalEvent.touches[0] : move_e,
                            dx = move_pos.pageX - start_position.x + that._scrolled_parent.scrollLeft - that._initial_scroll.x,
                            dy = move_pos.pageY - start_position.y + that._scrolled_parent.scrollTop - that._initial_scroll.y,
                            left = start_position.left + dx,
                            top = start_position.top + dy,
                            deltas = {};

                        if ( that.options.drag_contain ) {
                            left = left > that._drag_left_max ?
                                that._drag_left_max :
                                left < that._drag_left_min ?
                                    that._drag_left_min :
                                    left;
                            top = top > that._drag_top_max ?
                                that._drag_top_max :
                                top < that._drag_top_min ?
                                    that._drag_top_min :
                                    top;
                        }

                        deltas = {
                            dx  : left - start_position.left,
                            dy  : top - start_position.top,
                            left: left,
                            top : top
                        };
                        // move the element to its new position using deltas (dx, dy)
                        that.drag(el, deltas);
                        // call the over callback
                        that._dragover_callback && that._dragover_callback(move_e, deltas, $draggee);
                    };
                    endHandler = function (up_e) {
                        var up_pos, end_position;
                        // if we passed the delay
                        if ( up_e.timeStamp - start_time >= delay ) {
                            // get the end event object
                            up_pos = has_touch ? up_e.originalEvent.changedTouches[0] : up_e;
                            // set the final position and deltas
                            end_position = {
                                x   : up_pos.pageX,
                                y   : up_pos.pageY,
                                dx  : up_pos.pageX - down_pos.pageX,
                                dy  : up_pos.pageY - down_pos.pageY
                            };
                            that.dragging = false;
                            // if drag action wasn't canceled by user
                            if ( that.notify('post_drag_end', up_e, end_position, $draggee) !== false ) {
                                if ( is_cloned ) {
                                    // if not specified otherwise remove and delete the clone
                                    $draggee.remove();
                                    $draggee = null;
                                }
                            }
                            // otherwise handle cancellation for non-cloned
                            if ( ! is_cloned ) {
                                cancelAnimFrame(that._last_drag_anim);
                                $draggee.removeClass('uijet_draggee');
                                that._clearCachedStyle(draggee);
                            }
                        }
                        // clear end event handlers
                        $doc.off(MOVE_E);
                        // clean up
                        _finally();
                    };
                    // bind the move handler to the drag move event
                    $doc.on(MOVE_E, moveHandler)
                        // bind the end hanler to the drag end event
                        .one(END_E, endHandler);
                    // make sure we clean up if drag is rejected
                }, function () {
                    cancelHandler();
                    _finally();
                });
            } else {
                // re-bind start event
                _finally();
            }
        },
        /**
         * Initializes the draggee element.
         * 
         * #### Related options:
         * 
         * * `drag_parent`: query selector for the element that will be used to contain the dragging action.
         * 
         * @memberOf Dragged
         * @instance
         * @param {HTMLElement[]} $origin - the wrapped origin element that is the target for dragging.
         * @param HTMLElement[]} [$draggee] - a wrapped element to use as the draggee. Falls back to `$origin`.
         * @returns {Dragged}
         * @private
         */
        _initdraggee         : function ($origin, $draggee) {
            var parent = this.options.drag_parent || uijet.$element[0],
                origin = $origin[0],
                draggee = $draggee ? $draggee[0] : origin,
                offset;
            // get the offset of the original element from the `uijet.$element`
            offset = uijet.utils.getOffsetOf(origin, parent);
            // set the position and dimensions of the `$draggee`
            draggee.style.cssText += 'left:' + offset.x +
                'px;top:' + offset.y +
                'px;width:' + origin.offsetWidth +
                'px;height:' + origin.offsetHeight + 'px';
            // add the `uijet_draggee` class to the dragged element
            ($draggee || $origin).addClass('uijet_draggee');
            // and append it the `uijet.$element` if needed
            if ( draggee.parentNode !== parent ) {
                parent.appendChild(draggee);
            }
            this._contain(draggee, parent);
            return this;
        },
        /**
         * Gets the element to use as target for the dragging action.
         * 
         * #### Related options:
         * 
         * * `drag_element`: an element, query selector, or a function that retuns those, which will be used
         * as the dragging target. Defaults to top container of the instance's element.
         * 
         * @memberOf Dragged
         * @instance
         * @returns {HTMLElement[]} - the target element.
         * @private
         */
        _getDragElement     : function () {
            var option, $el;
            // if the option is set
            if ( option = this.options.drag_element ) {
                // if it's a `Function` call `uijet.utils.returnOf` on it
                if ( uijet.utils.isFunc(option) ) {
                    $el = uijet.utils.returnOf(option, this);
                }
                else {
                    $el = uijet.utils.toElement(option);
                }
                
            }
            // otherwise, get the top container of the widget
            else {
                $el = (this.$wrapper || this.$element);
            }
            return $el;
        },
        /**
         * Gets the closest ancestor of the given element that
         * will get a native scrollbar.
         * 
         * @memberOf Dragged
         * @instance
         * @param {HTMLELement} el - the contained element to start from.
         * @returns {HTMLElement} - the scrolled container.
         * @private
         */
        _getScrolledParent  : function (el) {
            var parent = el.parentNode,
                scrolled_re = /auto|scroll/,
                top_parent = document.documentElement,
                overflow;
            while ( parent && parent != top_parent ) {
                overflow = uijet.utils.getStyle(parent, 'overflow');
                if ( scrolled_re.test(overflow) ) {
                    break;
                }
                parent = parent.parentNode;
            }
            return parent;
        },
        /**
         * Moves the element around.
         * 
         * @memberOf Dragged
         * @instance
         * @param {HTMLElement} el - the element to move.
         * @param {Object} deltas - the deltas to use for translating the element, as `dx`/`dy` or `left`/`top`.
         * @param {boolean} [force_move] - whether to force the move, although not in a dragging state.
         * @returns {Dragged}
         */
        drag               : function (el, deltas, force_move) {
            this._last_drag_anim = requestAnimFrame(
                _dragHandler.bind(this, el, deltas, !!force_move, this._use_translate)
            );
            return this;
        },
        /**
         * Caches pre-specified style properties of element `el`.
         * 
         * @memberOf Dragged
         * @instance
         * @param {HTMLElement} el - the element to cache its style.
         * @returns {Dragged}
         * @private
         */
        _cacheStyle         : function (el) {
            var style = el.style,
                i = 0, prop, value;
            this.draggee_style_cache = {};

            for ( ; prop = this._cached_drag_styles[i++]; ) {
                value = style.getPropertyValue(prop);
                if ( value == null ) {
                    value = style[prop];
                }
                this.draggee_style_cache[prop] = value;
            }
            return this;
        },
        /**
         * Resets element `el`'s style from cache and clears that cache.
         * 
         * @memberOf Dragged
         * @instance
         * @param {HTMLElement} el - the element to reset its style.
         * @returns {Dragged}
         * @private
         */
        _clearCachedStyle   : function (el) {
            var cache = this.draggee_style_cache,
                style = el.style,
                prop;
            for ( prop in cache ) {
                if ( cache[prop] == null ) {
                    style.removeProperty(prop);
                }
                else {
                    style[prop] = cache[prop];
                }
            }
            delete this.draggee_style_cache;
            return this;
        },
        /**
         * Sets the boundaries for dragging contained draggee.
         * 
         * #### Related options:
         * 
         * * `drag_contain`: whether to contain the drag.
         * 
         * @memberOf Dragged
         * @instance
         * @param {HTMLElement} draggee - the element being dragged.
         * @param {HTMLElement} parent - the containing ancestor element.
         * @returns {Dragged}
         * @private
         */
        _contain            : function (draggee, parent) {
            var using_translate = this._use_translate, parent_style;
            if ( this.options.drag_contain ) {
                parent_style = uijet.utils.getStyle(parent);
                //TODO: add support for containing drag when using transform:translate
                if ( ! using_translate ) {
                    this._drag_left_min = 0;
                    this._drag_left_max = +parent_style.width.slice(0, -2) - draggee.offsetWidth;
                    this._drag_top_min = 0;
                    this._drag_top_max = +parent_style.height.slice(0, -2) - draggee.offsetHeight;
                }
            }
            return this;
        }
    });
}));
