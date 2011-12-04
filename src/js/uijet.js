(function (_window, undefined) {

    var $ = _window.jQuery,
        Utils = _window._$,
        mixins = {},
        adapters = {},
        widgets = {},
        views = {},
        widget_classes = {},
        widget_definitions = {},
        uijet;

    uijet =  {
        _normalizeMixins: function (mixin_names) {
            var _mixins;
            if ( typeof mixin_names == 'string' ) {
                _mixins = [mixin_names];
            } else if ( Utils.isArr(mixin_names) ) {
                _mixins = mixin_names.slice(0); // copy that
            }
            return _mixins;
        },
        _defineWidget   : function (_name, _props, _mixins) {
            widget_definitions[_name] = {
                proto   : _props,
                mixins  : _mixins
            };
            return this;
        },
        _generateWidget : function (_props, _mixins) {
            var _class = Utils.Create(this.BaseWidget, true),
                _mixin, _mixins_copy;
            // if we have mixins to mix then mix'em
            if ( _mixins && _mixins.length ) {
                _mixins_copy = _mixins.slice(0);
                while ( _mixin = _mixins_copy.shift() ) {
                    if ( mixins[_mixin] ) {
                        _class = Utils.Create(mixins[_mixin], _class, true);
                    }
                }
            }
            return Utils.Create(_props, _class, true);
        },
        Widget          : function (name, props, mixin_names) {
            var _mixins = this._normalizeMixins(mixin_names);
            // Cache the widget's definition for JIT creation
            this._defineWidget(name, props, _mixins);
            // finally create and register the class
            widget_classes[name] = this._generateWidget(props, _mixins);
            return this;
        },
        Mixin           : function (name, props) {
            mixins[name] = props;
            return this;
        },
        View            : function (name, widget) {
            views[name] = widget;
            return this;
        },
        Adapter         : function (name, adapter) {
            adapters[name] = adapter;
            return this;
        },
        init            : function (options) {
            var k, _methods = {};
            this.options = options;
            this.$element = $(options && options.element || 'body');
            this.isiPad();
            if ( options ) {
                if ( _methods = options.methods ) {
                    if ( options.methods_context ) {
                        for ( k in _methods ) {
                            _methods[k] = _methods[k].bind(options.methods_context);
                        }
                    }
                    Utils.extend(this, _methods);
                }
                if ( options.engine ) {
                    //TODO: implement hacking into BaseWidget.prototype better
                    this.BaseWidget.prototype.generate = options.engine;
                } else {
                    throw new Error('Template engine not specified');
                }
                this.options.animation_type = options.animation_type || 'slide';
                if ( options.parse ) {
                    this.parse();
                }
                if ( options.widgets ) {
                    this.startWidgets(options.widgets);
                }
            }
            options.dont_start || this.startup();
        },
        _registerWidget  : function (widget) {
            var $parent = widget.$element.parent(),
                _current = {
                    self        : widget,
                    contained   : []
                },
                _id = widget.id,
                _parent_id;
            widgets[_id] = _current;
            while ( $parent.length && ! $parent.is('body') ) {
                if ( $parent.hasClass('uijet_widget') ) {
                    _parent_id = $parent[0].id;
                    _current.container = _parent_id;
                    if ( _parent_id in widgets ) {
                        widgets[_parent_id].contained.push(_id);
                    }
                    break;
                }
                $parent = $parent.parent();
            }
            return this;
        },
        startWidget     : function (_type, _config) {
            var _w, l, _d, _c, _mixins;
            if ( _type in widget_classes ) {
                if ( _config.mixins ) {
                    _d = widget_definitions[_type];
                    _mixins = this._normalizeMixins(_config.mixins);
                    if ( _d.mixins ) {
                        _mixins = _d.mixins.concat(_mixins);
                    }
                    _c = this._generateWidget(_d.proto, _mixins);
                } else {
                    _c = widget_classes[_type];
                }
                _w = new _c();
                if ( _config.adapters ) {
                    l = _config.adapters.length;
                    while ( l-- ) {
                        Utils.extend(_w, adapters[_config.adapters[l]]);
                    }
                }
                _w.init(_config);
                this._registerWidget(_w);
            }
            return this;
        },
        startWidgets    : function (_widgets) {
            var i = 0, _c;
            while ( _c = _widgets[i++] ) {
                this.startWidget(_c.type, _c.config);
            }
            return this;
        },
        //TODO: implement this if it's needed at all or remove
        startup         : function () {
            this.publish('startup');
            return this;
        },
        getCurrentView  : function () {
            var _current = null;
            for ( var v in views ) {
                v = views[v];
                if ( v.options.state == 'current' ) {
                    _current = v;
                    break;
                }
            }
            return _current;
        },
        parse           : function () {
            this.$element.find('[data-akashi-type]')
                .each(function () {
                    var $this = $(this),
                        _type = $this.attr('data-akashi-type');
                    uijet.startWidget(_type, $this);
                });
            return this;
        },
        wakeContained   : function  (id, context) {
            var _contained = widgets[id].contained,
                deferreds = [],
                _widget,
                l = _contained.length;
            while ( l-- ) {
                _widget = widgets[_contained[l]].self;
                if ( _widget && ! _widget.options.dont_wake ) {
                    deferreds.unshift(_widget.wake(context));
                }
            }
            return deferreds;
        },
        sleepContained  : function (id) {
            var _contained = widgets[id].contained,
                l = _contained.length;
            while ( l-- ) {
                widgets[_contained[l]].self.sleep();
            }
            return this;
        },
        publish         : function (topic, data) {
            throw new Error('uijet.publish not implemented');
        },
        subscribe       : function (topic, handler, context) {
            throw new Error('uijet.subscribe not implemented');
        },
        unsubscribe     : function (topic, handler, context) {
            throw new Error('uijet.unsubscribe not implemented');
        },
        setRoute        : function (widget, route) {
            throw new Error('uijet.setRoute not implemented');
        },
        runRoute        : function (route, is_silent) {
            throw new Error('uijet.runRoute not implemented');
        },
        getRouteById    : function (widget_id) {
            for ( var w in widgets ) {
                if ( w == widget_id ) {
                    return widgets[w].self.getRoute();
                }
            }
            return null;
        },
        isiPad          : function () {
            if ( ~ navigator.userAgent.search(/iPad/i) ) {
                this.$element.addClass('ipad');
                this.is_iPad = true;
            }
            this.is_iPad && $('body').attr('ontouchmove', "(function preventTouchMove(e){e.preventDefault();}(event));");
            return this;
        },
        animate         : function (widget, direction, callback) {
            var transit_type = widget.options.animation_type || this.options.animation_type,
                $el = (widget.$wrapper || widget.$element);
            direction = direction ||'in';
            if ( uijet.back_navigation ) {
                uijet.back_navigation = false;
                $el.addClass('reverse');
            }
            $el.one('transitionend webkitTransitionEnd', function (e) {
                if ( uijet.back_navigation === false ) {
                    $el.removeClass('transitioned reverse');
                    delete uijet.back_navigation;
                } else {
                    $el.removeClass('transitioned');
                }
                callback.call(widget);
            });
            setTimeout(function () {
                $el.addClass('transitioned').toggleClass(transit_type + '_in', direction == 'in');
            }, 0);
            return this;
        },
        switchView      : function (view) {
            var _current = this.current_view;
            if ( _current !== view ) {
                _current && _current.sleep();
                this.current_view = view;
            }
            return this;
        }
    };

    _window.uijet = uijet;
}(window));
