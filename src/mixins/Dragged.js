// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['jquery', 'uijet_dir/uijet'], function ($, uijet) {
            return factory($, uijet);
        });
    } else {
        factory(jQuery, uijet);
    }
}(function ($, uijet) {
    var has_touch = uijet.support.touch,
        requestAnimFrame = uijet.Utils.requestAnimFrame,
        cancelAnimFrame = uijet.Utils.cancelAnimFrame,
        // get the prefixed `transform` property
        style_prop = uijet.Utils.getStyleProperty('transform');

    uijet.Mixin('Dragged', {
        dragged             : true,
        _cached_drag_styles : ['top', 'left', 'width', 'height'],
        appear              : function () {
            var options = this.options;
            this._super.apply(this, arguments);
            if ( options.auto_bind_drag ) {
                this.bindDrag(options.dragover_handler, options.drag_axis);
            }
            return this;
        },
        disappear           : function () {
            if ( options.auto_bind_drag ) {
                this.unbindDrag();
            }
            this._super.apply(this, arguments);
            return this;
        },
        // ### widget.bindDrag
        // @sign: bindDrag([over_callback], [axis])  
        // @return: this
        //
        // Sets the widget in a draggable state.  
        // `over_callback` is called every time the mouse/touchmove event is fired.  
        // The over callback takes the move event object as first argument, an `Object` with `dx` and `dy` properties
        // for the x and y deltas respectively and the jQuery-wrapped dragged element, or it's clone, as third argument.  
        // If `axis` is supplied - as a `String`: `'X'` or `'Y'`- the drag will be enabled in that axis only.  
        // Callbacks for drag start and end can be registered via the signals `post_drag_start` and `post_drag_end`
        // respectively.
        // The start callback takes the mousedown/touchstart event object as first argument and and the dragged element or it's clone as second.  
        // The end callback takes the mouseup/touchend event objet as first argument, the end position object -
        // with the keys: x, y, dx, dy - as second and the dragged element or it's clone as third argument.
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
        //TODO: add docs
        unbindDrag          : function () {
            // get the element used for starting drag
            var $drag_element = this._getDragElement(),
                // get the top container of the widget
                $el = (this.$wrapper || this.$element);
            // remove the set handler
            ($drag_element && $drag_element.length ? $drag_element : $el).off(uijet.support.click_events.start, this._dragstart_handler);
            return this;
        },
        //TODO: add docs
        _startHandler       : function (down_e) {
            var that = this,
                // get the top container of the widget
                $el = (this.$wrapper || this.$element),
                el = $el[0],
                // set the delay in ms
                delay = this.options.drag_delay || 150,
                is_cloned = this.options.drag_clone,
                // get the start event object  
                //TODO: this is adapted for iPad touch event object handling, need to test/implement the rest
                down_pos = has_touch ? down_e.originalEvent.touches[0] : down_e,
                // set position
                start_event_pos = { y : down_pos.pageY, x : down_pos.pageX },
                $doc = uijet.$(document),
                dfrd = uijet.Promise(),
                start_time = down_e.timeStamp,
                _finally, delayHandler, cancelHandler,
                MOVE_E, END_E, $draggee, draggee;
            this._cached_drag_styles.push(style_prop);
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
                this.notify(true, 'pre_drag_init', down_e, $draggee, start_event_pos);
                // in this stage we're just checking if this is really a case of dragging  
                // bind the move event to the delay-check handler
                $doc.on(MOVE_E, delayHandler)
                    // and a single drag end to the cancel handler
                    .one(END_E, cancelHandler);
                // if passed delay test activate draggable state
                uijet.when(dfrd.promise()).then(function () {
                    var continue_drag, moveHandler, endHandler;
                    that.dragging = true;
                    // remove the delay test handlers
                    cancelHandler();
                    // notify user drag is about to start
                    continue_drag = that.notify(true, 'pre_drag_start', down_e, $draggee);
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
                    that.notify(true, 'post_drag_start', down_e, $draggee);
                    // define the drag move handler
                    moveHandler = function (move_e) {
                        // On iPad this captures the event and prevent trickling - so quick-fix is to prevent default
                        down_e.preventDefault();
                        // get the move event object
                        var move_pos = has_touch ? move_e.originalEvent.touches[0] : move_e,
                            // calculate deltas
                            deltas = {
                                dx  : move_pos.pageX - start_event_pos.x + that._scrolled_parent.scrollLeft - that._initial_scroll.x,
                                dy  : move_pos.pageY - start_event_pos.y + that._scrolled_parent.scrollTop - that._initial_scroll.y
                            };
                        // move the element to its new position using deltas (dx, dy)
                        that._drag(el, deltas);
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
                            // notify user of drag end
                            if ( that.notify(true, 'post_drag_end', up_e, end_position, $draggee) !== false && is_cloned ) {
                                // if not specified otherwise remove and delete the clone
                                $draggee.remove();
                                $draggee = null;
                            }
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
        // ### widget._initdraggee
        // @sign: _initdraggee($original, $draggee)  
        // @return: this
        //
        // Initializes the dragged element. Sets its position, dimensions and other styles.
        _initdraggee         : function ($orig, $draggee) {
            var parent = this.options.drag_parent || uijet.$element[0],
                orig = $orig[0],
                draggee = $draggee ? $draggee[0] : orig,
                offset;
            // get the offset of the original element from the `uijet.$element`
            offset = uijet.Utils.getOffsetOf(orig, parent);
            // set the position and dimensions of the `$draggee`
            draggee.style.cssText += 'left:' + offset.x +
                                    'px;top:' + offset.y +
                                    'px;width:' + orig.offsetWidth +
                                    'px;height:' + orig.offsetHeight + 'px';
            // add the `uijet_draggee` class to the dragged element
            draggee.classList.add('uijet_draggee');
            // and append it the `uijet.$element` if needed
            if ( draggee.parentNode !== parent ) {
                parent.appendChild(draggee);
            }
            return this;
        },
        // ### widget._getDragElement
        // @sign: _getDragElement  
        // @return: $element
        //
        // Checks if the `drag_element` option is set and returns a jQuery-wrapped element from it.
        // That drag start event will be contained to that element alone (defaults to the widget's top container).
        _getDragElement     : function () {
            var option, $el;
            // if the option is set
            if ( option = this.options.drag_element ) {
                // if it's an HTMLElement just wrap it
                if ( option.nodeType === 1 ) {
                    $el = uijet.$(option);
                // if it's a jQuery object we're set
                } else if ( option.jquery ) {
                    $el = option;
                // if it's a `String` treat it as a selector inside the widget
                } else if ( typeof option === 'string' ) {
                    $el = (this.$wrapper || this.$element).find(option);
                // if it's a `Function` call `uijet.Utils.returnOf` on it
                } else if ( uijet.Utils.isFunc(option) ) {
                    $el = uijet.Utils.returnOf(option, this);
                }
            }
            // otherwise, get the top container of the widget
            else {
                $el = (this.$wrapper || this.$element);
            }
            return $el;
        },
        // ### widget._getScrolledParent
        // @sign: _getScrolledParent(el)  
        // @return: scrolled_parent
        //
        // Returns the scrolled parent element of the element `el`.
        _getScrolledParent  : function (el) {
            var parent = el.parentNode,
                scrolled_re = /auto|scroll/,
                top_parent = document.documentElement,
                overflow;
            while ( parent && parent != top_parent ) {
                overflow = uijet.Utils.getStyle(parent, 'overflow');
                if ( scrolled_re.test(overflow) ) {
                    break;
                }
                parent = parent.parentNode;
            }
            return parent;
        },
        // ### widget._drag
        // @sign: _drag(el, deltas)  
        // @return: this
        //
        // Moves the element `ele to its new position.using `deltas`
        _drag               : function (el, deltas) {
            var that = this;
            this._last_drag_anim = requestAnimFrame(function () {
                //TODO: add transform support check  
                //TODO: make the animation property value (translate, etc.) as a return value of a generic method of uijet  
                //TODO: add option to opt or fallback to top/left  
                var trans;
                if ( that.dragging ) {
                    //TODO: this will override other transforms
                    // if `axis` is set then animate only along that axis
                    if ( that._drag_axis ) {
                        trans = that._drag_axis === 'X' ? deltas.dx : deltas.dy;
                        el.style[style_prop] = 'translate' + that._drag_axis + '(' + trans + 'px)';
                    } else {
                        trans = deltas.dx + 'px,' + deltas.dy+ 'px';
                        el.style[style_prop] = uijet.support['3d'] ?
                            'translate3d(' + trans + ',0)' :
                            'translate(' + trans + ')';
                    }
                }
            });
            return this;
        },
        // ### widget._cacheStyle
        // @sign: _cacheStyle(el)  
        // @return: this
        //
        // Caches the top, left, height and width style properties of the given `el` element.
        _cacheStyle         : function (el) {
            var style = el.style,
                i = 0, prop;
            this.draggee_style_cache = {};
            
            for ( ; prop = this._cached_drag_styles[i++]; ) {
                this.draggee_style_cache[prop] = style.getPropertyValue(prop);
            }
            return this;
        },
        // ### widget._clearCachedStyle
        // @sign: _clearCachedStyle(el)  
        // @return: this
        //
        // Re-sets the style properties of element `el` and deletes the old cache.
        _clearCachedStyle   : function (el) {
            var cache = this.draggee_style_cache,
                style = el.style,
                prop;
            for ( prop in cache ) {
                style[prop] = cache[prop];
            }
            delete this.draggee_style_cache;
            return this;
        }
    });
}));