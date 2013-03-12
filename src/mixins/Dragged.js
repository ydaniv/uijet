// ### AMD wrapper
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
        requestAnimFrame = uijet.Utils.requestAnimFrame,
        cancelAnimFrame = uijet.Utils.cancelAnimFrame,
        // get the prefixed `transform` property
        style_prop = uijet.Utils.getStyleProperty('transform'),
        translation_re = /translate(?:X|Y|Z|3d)?\(([^\)]+)\)/;

    uijet.Mixin('Dragged', {
        dragged             : true,
        init                : function () {
            this._super.apply(this, arguments);

            var cached_styles = ['width', 'height'],
                use_translate = uijet.support.transform && ! this.options.dont_translate;

            this._use_translate = use_translate;
            // handle the cached style properties
            if ( use_translate ) {
                cached_styles.push('top', 'left');
                if ( this.options.drag_clone ) {
                    cached_styles.push(style_prop);
                }
            }
            this._cached_drag_styles = cached_styles;
            return this;
        },
        appear              : function () {
            var options = this.options;
            this._super.apply(this, arguments);
            if ( ! options.dont_auto_drag ) {
                this.bindDrag(options.dragover_handler, options.drag_axis);
            }
            return this;
        },
        disappear           : function () {
            if ( ! this.options.dont_auto_drag ) {
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
                //TODO: this is adapted for iOS touch event object handling, need to test/implement the rest
                down_pos = has_touch ? down_e.originalEvent.touches[0] : down_e,
                offset = uijet.Utils.getOffsetOf(el, this.options.drag_parent || uijet.$element[0]),
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
            ($draggee || $orig).addClass('uijet_draggee');
            // and append it the `uijet.$element` if needed
            if ( draggee.parentNode !== parent ) {
                parent.appendChild(draggee);
            }
            this._contain(draggee, parent);
            return this;
        },
        // ### widget._getDragElement
        // @sign: _getDragElement  
        // @return: $element
        //
        // Checks if the `drag_element` option is set and returns a DOM query result object from it.
        // That drag start event will be contained to that element alone (defaults to the widget's top container).
        _getDragElement     : function () {
            var option, $el;
            // if the option is set
            if ( option = this.options.drag_element ) {
                // if it's an HTMLElement just wrap it
                if ( option.nodeType === 1 ) {
                    $el = uijet.$(option);
                }
                // if it's a DOM query result object we're set
                else if ( option[0] && option[0].nodeType === 1 ) {
                    $el = option;
                }
                // if it's a `String` treat it as a selector inside the widget
                else if ( typeof option === 'string' ) {
                    $el = (this.$wrapper || this.$element).find(option);
                }
                // if it's a `Function` call `uijet.Utils.returnOf` on it
                else if ( uijet.Utils.isFunc(option) ) {
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
        // ### widget.drag
        // @sign: drag(el, deltas, [force_move])  
        // @return: this
        //
        // Moves the element `el` to its new position.using `deltas`
        drag               : function (el, deltas, force_move) {
            var that = this,
                use_translate = this._use_translate;
            this._last_drag_anim = requestAnimFrame(function () {
                //TODO: make the animation property value (translate, etc.) as a return value of a generic method of uijet
                var horizontal, property, trans, px = 'px';
                if ( that.dragging || force_move ) {
                    //TODO: this will override other transforms  
                    // if `axis` is set then animate only along that axis
                    if ( that._drag_axis ) {
                        horizontal = that._drag_axis === 'X';

                        if ( use_translate ) {
                            trans = horizontal ? deltas.dx : deltas.dy;
                            el.style[style_prop] = 'translate' + that._drag_axis + '(' + trans + 'px)';
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
        //TODO: add docs
        _contain            : function (draggee, parent) {
            var using_translate = this._use_translate, parent_style;
            if ( this.options.drag_contain ) {
                parent_style = uijet.Utils.getStyle(parent);
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