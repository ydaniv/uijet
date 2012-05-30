//TODO: add docs
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
    uijet.Mixin('Dragged', {
        dragged             : true,
        bindDrag            : function (over_callback, axis) {
            var that = this,
                $el = (this.$wrapper || this.$element),
                is_iPad = uijet.is_iPad,
                requestAnimFrame = uijet.Utils.requestAnimFrame,
                style_prop = uijet.Utils.getStyleProperty('transform'),
                $drag_element = this._getDragElement(),
                delay = this.options.drag_delay || 150,
                START_E, MOVE_E, END_E, $clone;
            if ( is_iPad ) {
                START_E = 'touchstart';
                MOVE_E = 'touchmove';
                END_E = 'touchend';
            } else {
                START_E = 'mousedown';
                MOVE_E = 'mousemove';
                END_E = 'mouseup';
            }
            if ( this.options.drag_clone ) {
                $clone = $el.clone();
            }
            ($drag_element && $drag_element.length ? $drag_element : $el).one(START_E, function (down_e) {
                var down_pos = is_iPad ? down_e.originalEvent.touches[0] : down_e,
                    start_event_pos = { y : down_pos.pageY, x : down_pos.pageX },
                    el = $el[0],
                    $doc = $(document),
                    clone = $clone && $clone[0],
                    start_time = down_e.timeStamp,
                    delayHandler = function (move_e) {
                        if ( move_e.timeStamp - start_time >= delay ) dfrd.resolve();
                    },
                    cancelHandler = function (up_e) {
                        if ( up_e && dfrd.state() === 'pending' && up_e.timeStamp - start_time < delay ) {
                            dfrd.reject();
                        } else {
                            $doc.unbind(MOVE_E, delayHandler)
                                .unbind(END_E, cancelHandler);
                        }
                    },
                    _finally = function () {
                        that.options.drag_once || that.bindDrag(over_callback, axis);
                    },
                    dfrd = $.Deferred();
                if ( is_iPad || down_pos.which === 1 ) {
                    $doc.bind(MOVE_E, delayHandler)
                        .one(END_E, cancelHandler);
                    $.when(dfrd.promise()).then(function () {
                        that.dragging = true;
                        cancelHandler();
                        that._initDragee($el, $clone);
                        if ( clone ) {
                            el = clone;
                        }
                        that.notify(true, 'post_drag_start', down_e, $clone);
                        $doc.bind(MOVE_E, function (move_e) {
                            // On iPad this captures the event and prevent trickling - so quick-fix is to prevent default
                            down_e.preventDefault();
                            var move_pos = is_iPad ? move_e.originalEvent.touches[0] : move_e,
                                x_pos = move_pos.pageX - start_event_pos.x,
                                y_pos = move_pos.pageY - start_event_pos.y;
                            requestAnimFrame(function () {
                                //TODO: add transform support check
                                //TODO: make the animation property value (translate, etc.) as a return value of a generic method of uijet
                                //TODO: add option to opt or fallback to top/left
                                var trans;
                                if ( axis ) {
                                    el.style[style_prop] = 'translate' + axis + '(' + (axis === 'X' ? x_pos : y_pos) + 'px)';
                                } else {
                                    trans = x_pos + 'px,' + y_pos+ 'px';
                                    el.style[style_prop] = uijet.support['3d'] ? 'translate3d(' + trans + ',0)' : 'translate(' + trans + ')';
                                }
                            });
                            over_callback && over_callback.call(that, move_e, $clone);
                        }).one(END_E, function (up_e) {
                            var up_pos, end_position;
                            if ( up_e.timeStamp - start_time >= delay ) {
                                up_pos = is_iPad ? up_e.originalEvent.changedTouches[0] : up_e;
                                end_position = {
                                    x   : up_pos.pageX,
                                    y   : up_pos.pageY,
                                    dx  : up_pos.pageX - down_pos.pageX,
                                    dy  : up_pos.pageY - down_pos.pageY
                                };
                                that.dragging = false;
                                that.notify(true, 'post_drag_end', up_e, end_position, $clone);
                            }
                            $doc.unbind(MOVE_E);
                        });
                    }, cancelHandler).always(_finally);
                } else {
                    _finally();
                }
            });
        },
        _initDragee      : function ($orig, $clone) {
            var orig, offset;
            if ( $clone ) {
                orig = $orig[0];
                offset = uijet.Utils.getOffsetOf(orig, uijet.$element[0]);
                $clone.css({
                    left    : offset.x + 'px',
                    top     : offset.y + 'px',
                    width   : orig.offsetWidth + 'px',
                    height  : orig.offsetHeight + 'px'
                });
            }
            ($clone || $orig).addClass('uijet_dragee')
                             .appendTo(uijet.$element);
        },
        _getDragElement : function () {
            var option, el;
            if ( option = this.options.drag_element ) {
                if ( option.nodeType === 1 ) {
                    el = $(option);
                } else if ( option.jquery ) {
                    el = option;
                } else if ( typeof option === 'string' ) {
                    el = (this.$wrapper || this.$element).find(option);
                } else if ( uijet.Utils.isFunc(option) ) {
                    el = uijet.Utils.returnOf(option, this);
                }
            }
            return el;
        }
    });
}));