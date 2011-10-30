(function (_window, undefined) {

    var $ = _window.jQuery,
        Utils = _window._$,
        mixins = {},
        adapters = {},
        widgets = {},
        views = {},
        widget_classes = {},
        uijet;

    uijet =  {
        Widget          : function (name, props, mixin_names) {
            var _mixins, _class, _mixin;
            // normalize mixins
            if ( typeof mixin_names == 'string' ) {
                _mixins = [mixin_names];
            } else if ( Utils.isArr(mixin_names) ) {
                _mixins = mixin_names;
            }
            // if we have mixins to mix then mix'em
            if ( _mixins && _mixins.length ) {
                while ( _mixin = _mixins.shift() ) {
                    if ( mixins[_mixin] ) {
                        _class = Utils.Create(mixins[_mixin], _class, true);
                    }
                }
                // place the chain of mixins on top of BaseWidget
                _class = _class ? Utils.Create(_class, this.BaseWidget, true) : null;
            }
            // finally create and register the class
            widget_classes[name] = Utils.Create(props, _class || this.BaseWidget, true);
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
            var _w, l;
            if ( _type in widget_classes ) {
                _w = new widget_classes[_type]();
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
        startup         : function () {},
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
        setRoute        : function (widget) {
            throw new Error('uijet.setRoute not implemented');
        },
        runRoute        : function (route, is_silent) {
            throw new Error('uijet.runRoute not implemented');
        },
        isiPad           : function () {
            if ( ~ navigator.userAgent.search(/iPad/i) ) {
                this.$element.addClass('ipad');
                this.is_iPad = true;
            }
            $('body').attr('ontouchmove', "(function preventTouchMove(e){e.preventDefault();}(event));");
            return this;
        },
        //TODO: remove views specific transition logic
        animate         : function (widget, callback) {
            var transit_type = widget.options.animation_type || this.options.animation_type,
                animation;
            if ( uijet.back_navigation ) {
                uijet.back_navigation = false;
                widget.$element.addClass('reverse');
                transit_type += '_reverse';
            }
            switch ( transit_type ) {
                case 'slide':
                    animation = {right: this.is_iPad ? '0' : '0%'};
                    break;
                case 'slide_reverse':
                    animation = {left: this.is_iPad ? '0' : '0%'};
                    break;
            }
            widget.$element.animate(animation, function () {
                if ( uijet.back_navigation === false ) {
                    widget.$element.removeClass('reverse');
                    delete uijet.back_navigation;
                }
                callback.call(widget);
            });
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