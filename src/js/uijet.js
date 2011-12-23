(function (_window, undefined) {

    var Function = _window.Function,
        Object = _window.Object,
        objToString = Object.prototype.toString,
        arraySlice = _window.Array.prototype.slice,
        $ = _window.jQuery,
        mixins = {},
        adapters = {},
        widgets = {},
        views = {},
        widget_classes = {},
        widget_definitions = {},
        uijet;

    // shim Function.bind to support Safari -5 - mostly old iOS
    if ( typeof Function.bind != 'function' ) {
        Function.prototype.bind = function (scope) {
            var _self = this;
            return function () {
                return _self.apply(scope, arguments);
            };
        };
    }
    function isObj(obj) {
        return objToString.call(obj) == '[object Object]';
    }

    function isArr(obj) {
        return objToString.call(obj) == '[object Array]';
    }

    function isFunc(obj) {
        return typeof obj == 'function';
    }

    /*
     * @sign: extend(target, source[, source1[, ...]])
     * @sign: extend(bool, target, source[, source1[, ...]])
     * @return: target
     *
     * Deep (or shallow) copy objects (Arrays are shallow copied).
     * If first argument is `true` then deep copy.
     * First (or second of first is a Boolean) argument is the target.
     * All following arguments are source objects.
     * Objects are copied to target from left to right.
     */
    function extend() {
        var args = arraySlice.call(arguments),
            target = args.shift(),
            source,
            is_deep,
            l, s;
        if ( typeof target == 'boolean' ) {
            is_deep = target;
            target = args.shift();
        }
        l = args.length;
        while ( source = args.shift(), l-- ) {
            if ( is_deep ) {
                for ( s in source ) {
                    if ( isObj(source[s]) && isObj(target[s]) ) {
                        target[s] = extend(true, {}, target[s], source[s]);
                    } else {
                        target[s] = source[s];
                    }
                }
            } else {
                for ( s in source ) {
                    target[s] = source[s];
                }
            }
        }
        return target;
    }

    /*
     * @sign: extendProto(target, source[, source1[, ...]])
     * @return: target
     *
     * Deep copy (prototype) objects (Arrays are shalow copied).
     * First argument is the target.
     * All following arguments are source objects.
     * Objects are copied to target from left to right.
     * If a property of same name exists in both source and target:
     * * object: deep copy
     * * function: target method is wrapped to support a super call to the source method
     * * else: shallow copy
     */
    function extendProto() {
        var args = arraySlice.call(arguments),
            target = args.shift(),
            source,
            l, s;
        l = args.length;
        while ( source = args.shift(), l-- ) {
            for ( s in source ) {
                if ( isFunc(source[s]) && isFunc(target[s]) ) {
                    target[s] = (function (_super, _self) {
                        return function () {
                            var tmp = this._super, ret;
                            this._super = _super;
                            ret = _self.apply(this, arguments);
                            this._super = tmp;
                            return ret;
                        };
                    }(target[s], source[s]));
                } else if ( isObj(source[s]) && isObj(target[s]) ) {
                    target[s] = extend(true, {}, target[s], source[s]);
                } else {
                    target[s] = source[s];
                }
            }
        }
        return target;
    }

    /*
     * @sign: Create(this, [extended], [as_constructor])
     * @sign: Create(this, [as_constructor]])
     * @return: this (class or instance)
     *
     * Create a class with this specifying the top level and extended the rest of the prototype chain
     * using extendProto for inheritance.
     * Both this and extended can be either an Object or a constructor function.
     * In the latter case the prototype property is used.
     * If as_constructor flag is passed and true the returned result is a constructor function,
     * otherwise it is an instance of that class.
     */
    function Create(proto, _extends, as_constructor) {
        var _proto = isFunc(proto) ? proto.prototype : proto;
        function F() {}
        if ( typeof _extends == 'boolean' ) {
            as_constructor = _extends; _extends = null;
        }
        if ( _extends ) {
            _proto = extendProto(
                Object.create(isFunc(_extends) ? _extends.prototype : _extends),
                _proto
            );
        }
        F.prototype = _proto;
        return as_constructor ? F : new F();
    }

    uijet =  {
        //TODO: perhaps replace this with a generic util that normalizes args to an Array
        /*
         * @sign: _normalizeMixins(mixin_names)
         * @return: mixins_names
         *
         * Normalizes the mixins argument to a list of names,
         * whether it is a single string or a list of strings.
         * If it is a an Array the returned array is a copy of the original one.
         */
        _normalizeMixins: function (mixin_names) {
            var _mixins;
            if ( typeof mixin_names == 'string' ) {
                _mixins = [mixin_names];
            } else if ( isArr(mixin_names) ) {
                _mixins = mixin_names.slice(0); // copy that
            }
            return _mixins;
        },
        /*
         * @sign: _defineWidget(name, props, [mixins])
         * @return: uijet
         *
         * Caches a definition of a widget inside uijet,
         * using name as the key and props as the definition.
         * Optional mixins argument can be supplied for defining this widget on top of a mixin.
         */
        _defineWidget   : function (_name, _props, _mixins) {
            widget_definitions[_name] = {
                proto   : _props,
                mixins  : _mixins
            };
            return this;
        },
        /*
         * @sign: _generateWidget(_props, [_mixins])
         * @return: widget_class
         *
         * Generate a widget class using Create with uijet.BaseWidget as the base prototype.
         */
        _generateWidget : function (_props, _mixins) {
            var _class = Create(this.BaseWidget, true),
                _mixin, _mixins_copy;
            // if we have mixins to mix then mix'em
            if ( _mixins && _mixins.length ) {
                _mixins_copy = _mixins.slice(0);
                while ( _mixin = _mixins_copy.shift() ) {
                    if ( mixins[_mixin] ) {
                        _class = Create(mixins[_mixin], _class, true);
                    }
                }
            }
            return Create(_props, _class, true);
        },
        /*
         * @sign: Widget(name, props, [mixin_names])
         * @return: uijet
         *
         * Define and generate a widget class.
         * Mixin_names are normalized into a list of names.
         */
        Widget          : function (name, props, mixin_names) {
            var _mixins = this._normalizeMixins(mixin_names);
            // Cache the widget's definition for JIT creation
            this._defineWidget(name, props, _mixins);
            // finally create and register the class
            widget_classes[name] = this._generateWidget(props, _mixins);
            return this;
        },
        /*
         * @sign: Mixin(name, props)
         * @return: uijet
         *
         * Define a mixin to be used by uijet.
         */
        Mixin           : function (name, props) {
            mixins[name] = props;
            return this;
        },
        /*
         * @sign: View(name, widget)
         * @return: uijet
         *
         * Define a view to be used by uijet.
         */
        View            : function (name, widget) {
            views[name] = widget;
            return this;
        },
        Form            : function (name, widget) {
            var $el = widget.$element,
                method = $el.attr('method') || 'get',
                route = $el.attr('action');
            this.setRoute(widget, {method: method, path: route}, 'send');
            return this;
        },
        /*
         * @sign: Adapter(name, adapter)
         * @return: uijet
         *
         * Define an adapter to be used by uijet.
         */
        Adapter         : function (name, adapter) {
            adapters[name] = adapter;
            return this;
        },
        /*
         * @sign: init([options])
         * @return: uijet
         *
         * Initialize uijet.
         * Defines all required and unimplemented methods, connects it to a template engine
         * and starts all instances of predefined widgets in the app.
         * options:
         * * element: selector for the containing HTMLElement of the application. defualt is 'body'.
         * * methods: object of methods that will be copied into uijet. Required.
         * * methods_context: context object to be used for binding the execution of the above mentioned methods to.
         * * engine: function that generates the HTML,
         *           basically a wrapper for the given template engine's render method. Required.
         * * wigets: widget definitions to be used by uijet.
         * * animation_type: default type of animation to be used across the app. default is 'slide'.
         * * parse: a flag instructing uijet to parse the HTML to look for widget definitions. Default is false.
         * * dont_start: a flag instructing uijet not to run startup as a callback to init. Default is false.
         */
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
                    extend(this, _methods);
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
            return this;
        },
        /*
         * @sign: registerWidget(widget)
         * @return: uijet
         *
         * Registers a widget into uijet's widgets tree.
         */
        registerWidget  : function (widget) {
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
        /*
         * @sign: unregisterWidget(widget)
         * @return: uijet
         *
         * Unregisters a widget from uijet's widgets tree.
         */
        unregisterWidget: function (widget) {
            var _id = widget.id, registration, _parent_contained;
            if ( _id in widgets ) {
                registration = widgets[_id];
                if ( registration.container ) {
                    _parent_contained = widgets[registration.container].contained;
                    _parent_contained.splice(_parent_contained.indexOf(_id), 1);
                }
                delete widgets[_id];
            }
            return this;
        },
        /*
         * @sign: startWidget(type, config)
         * @return: uijet
         *
         * Builds an instance of a widget using a cached definition.
         * This instance will be initialized and registered into uijet at the end.
         * type is a string representing the widget's type.
         * config is additional options to add to that instance:
         * * mixins: a name (String) of a mixin or a list (Array) of names of mixins to add to this instance build
         * * adapters: a list of names of mixins to add to this instance
         */
        startWidget     : function (_type, _config) {
            var _w, l, _d, _c, _mixins;
            if ( _type in widget_classes ) {
                // if we have mixins configred to mix
                if ( _config.mixins ) {
                    // get the stored widget class
                    _d = widget_definitions[_type];
                    _mixins = this._normalizeMixins(_config.mixins);
                    // concatenate the list of mixins to use
                    if ( _d.mixins ) {
                        _mixins = _d.mixins.concat(_mixins);
                    }
                    // create a new class from the joined definitions
                    _c = this._generateWidget(_d.proto, _mixins);
                } else {
                    // just get the stored widget class definition
                    _c = widget_classes[_type];
                }
                // craete a new widget instance from that class
                _w = new _c();
                // if we have adapters to use
                if ( _config.adapters ) {
                    l = _config.adapters.length;
                    // extend this instance with these adapters
                    while ( l-- ) {
                        extend(_w, adapters[_config.adapters[l]]);
                    }
                }
                // init the instance
                _w.init(_config);
                // register this instance to uijet
                this.registerWidget(_w);
            }
            return this;
        },
        /*
         * @sign: startWidgets(widgets)
         * @return: uijet
         *
         * Accepts an array of widgets definitions and starts them one by one.
         */
        startWidgets    : function (_widgets) {
            var i = 0, _c;
            while ( _c = _widgets[i++] ) {
                this.startWidget(_c.type, _c.config);
            }
            return this;
        },
        /*
         * @sign: startup()
         * @return: uijet
         *
         * Starts up uijet and publishes this event across the app.
         */
        //TODO: implement this if it's needed at all or remove
        startup         : function () {
            this.publish('startup');
            return this;
        },
        /*
         * @sign: getCurrentView()
         * @return: current_view_widget
         *
         * Finds current view and returns it
         */
        getCurrentView  : function () {
            var _current = this.current_view, v;
            if ( ! _current ) {
                for ( v in views ) {
                    if ( views[v].options.state == 'current' ) {
                        _current = views[v];
                        break;
                    }
                }
            }
            return _current;
        },
        /*
         * @sign: parse()
         * @return: uijet
         *
         * Walks the DOM, starting from the container element for the application,
         * finds all widget definitions inside the markup and starts these widgets.
         * This method looks for the 'data-akashi-type' attribute on tags.
         */
        parse           : function () {
            this.$element.find('[data-akashi-type]')
                .each(function () {
                    var $this = $(this),
                        _type = $this.attr('data-akashi-type');
                    //TODO: this will not work, need to implement this all the way
                    uijet.startWidget(_type, $this);
                });
            return this;
        },
        /*
         * @sign: wakeContained(id, [context])
         * @return: deferred_widgets
         *
         * Takes an ID of a widget and wakes all its contained widgets.
         * Takes an options context object as a second argument.
         * Returns an array of jQuery.Deferred promises,
         * each representing the promise returned by a contained widget's wake call
         */
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
        /*
         * @sign: sleepContained(id)
         * @return: uijet
         *
         * Takes an ID of a widget and sleeps all its contained widgets.
         */
        sleepContained  : function (id) {
            var _contained = widgets[id].contained,
                l = _contained.length;
            while ( l-- ) {
                widgets[_contained[l]].self.sleep(true);
            }
            return this;
        },
        /*
         * @sign: destroyContained(id)
         * @return: uijet
         *
         * Takes an ID of a widget and destroys and unregisters all its contained widgets.
         */
        destroyContained: function (id) {
            var _contained = widgets[id].contained,
                l = _contained.length,
                _w;
            while ( l-- ) {
                _w = widgets[_contained[l]].self;
                _w.destroy();
                this.unregisterWidget(_w);
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
        setRoute        : function (widget, route, callback) {
            throw new Error('uijet.setRoute not implemented');
        },
        unsetRoute      : function (widget, route) {
            throw new Error('uijet.unsetRoute not implemented');
        },
        runRoute        : function (route, is_silent) {
            throw new Error('uijet.runRoute not implemented');
        },
        /*
         * @sign: getRouteById(widget_id)
         * @return: route or null
         *
         * Takes an ID of a widget and returns a route of the found widget or null.
         */
        getRouteById    : function (widget_id) {
            for ( var w in widgets ) {
                if ( w == widget_id ) {
                    return widgets[w].self.getRoute();
                }
            }
            return null;
        },
        /*
         * @sign: isiPad()
         * @return: uijet
         *
         * Sniffs the userAgent for an iPad.
         * If true then handles all iPad related actions,
         * such as adding the "ipad" class to the application container,
         * disabling touchmove on the entire viewport, etc.
         */
        isiPad          : function () {
            // sniff userAgent for iPad
            if ( ~ navigator.userAgent.search(/iPad/i) ) {
                this.$element.addClass('ipad');
                this.is_iPad = true;
            }
            // prevent touchmove event of the viewport
            this.is_iPad && $('body').attr('ontouchmove', "(function preventTouchMove(e){e.preventDefault();}(event));");
            return this;
        },
        /*
         * @sign: animate(widget, direction, callback)
         * @return: uijet
         *
         * Handles widgets animation across the appliaction.
         * Mostly transitions of widgets in and out of the view.
         * Takes a widget to animate, a direction ("in"/"out") of the animation
         * and a callback to fire once the animation is done.
         * This callback will usually resolve a promise waiting for the animation to end.
         */
        animate         : function (widget, direction, callback) {
            var transit_type = widget.options.animation_type || this.options.animation_type,
                $el = (widget.$wrapper || widget.$element), $_children, _h;
            direction = direction ||'in';
            if ( uijet.back_navigation ) {
                uijet.back_navigation = false;
                $el.addClass('reverse');
            }
            // bind just one event listener to the end of the animation
            $el.one('transitionend webkitTransitionEnd', function (e) {
                if ( uijet.back_navigation === false ) {
                    $el.removeClass('transitioned reverse');
                    delete uijet.back_navigation;
                } else {
                    $el.removeClass('transitioned');
                }
                callback && callback.call(widget);
            });
            // Handle height property animation specially since it's broken in browsers
            if ( 'fold' == transit_type ) {
                $el.addClass('transitioned');
                if ( direction == 'in' ) {
                    _h = widget._total_height;
                    if ( ! _h ) {
                        $_children = $el.children();
                        _h = $_children.length * $_children.eq(0).outerHeight(true);
                        widget._total_height = _h;
                    }
                    $el[0].style.height = _h + 'px';
                } else {
                    $el[0].style.height = 0;
                }
            } else {
                // throw the actual animation to the top of the execution queue
                // so it is less likely to be interfered with other rendering/code execution
                setTimeout(function () {
                    $el.addClass('transitioned').toggleClass(transit_type + '_in', direction == 'in');
                }, 0);
            }
            return this;
        },
        /*
         * @sign: switchView(view)
         * @return: uijet
         *
         * Takes a view widget and switches the current view with it.
         * Most importantly, this method calls the sleep method of the current view.
         */
        switchView      : function (view) {
            var _current = this.current_view;
            if ( _current !== view ) {
                _current && _current.sleep();
                this.current_view = view;
            }
            return this;
        }
    };

    // set a namespace on uijet for utility functions.
    uijet.Utils = {
        extend      : extend,
        extendProto : extendProto,
        Create      : Create,
        isObj       : isObj,
        isArr       : isArr
    };
    // set uijet in global namespace
    _window.uijet = uijet;
}(window));
