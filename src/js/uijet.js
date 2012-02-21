// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        // for now we require jQuery
        define(['jquery'], function ($) {
            return (root.uijet = factory($, root));
        });
    } else {
        // if not using an AMD library set the global `uijet` namespace
        root.uijet = factory(root.jQuery, root);
    }
}(this, function ($, _window) {
    //TODO: remove routing from dependencies  
    //TODO: implement a method for creating a context object from `arguments`  
    //TODO: create an adapter for promises API  
    //TODO: create an adapter for XHR  
    // cache some gloabls
    var Function = _window.Function,
        Object = _window.Object,
        Array = _window.Array,
        // native utilities caching
        objToString = Object.prototype.toString,
        arraySlice = Array.prototype.slice,
        // sandbox's registries
        mixins = {},
        adapters = {},
        widgets = {},
        views = {},
        // caching built predefined widgets' classes
        widget_classes = {},
        // caching pre-built predefined widgets' classes
        widget_definitions = {},
        // constants
        TYPE_ATTR = 'data-uijet-type',
        ATTR_PREFIX = 'data-uijet-',
        TOP_ADAPTER_NAME = 'TopAdapter',
        // the sandbox
        uijet;

    // a simple shim of Function.bind to support Safari -5 - mostly old iOS
    if ( typeof Function.bind != 'function' ) {
        Function.prototype.bind = function (scope) {
            var _self = this,
                args = arraySlice.call(arguments, 1);
            return function () {
                return _self.apply(scope, args.concat(arraySlice.call(arguments)));
            };
        };
    }
    // ### Utils.isObj
    // utility for checking if param is an Obejct
    function isObj(obj) {
        return objToString.call(obj) == '[object Object]';
    }
    // ### Utils.isArr
    // utility for checking if param is an Array
    function isArr(obj) {
        return objToString.call(obj) == '[object Array]';
    }
    // ### Utils.isFunc
    // utility for checking if param is a Function
    function isFunc(obj) {
        return typeof obj == 'function';
    }
    // ### Utils.toArray
    // utility for either wrapping a param with an `Array` or return a copy of that array  
    // if no arguments are supplied then return `undefined`
    function toArray(obj) {
        var arr;
        if ( isArr(obj) ) {
            // copy that
            arr = obj.slice(0);
        } else if ( typeof obj != 'undefined' ) {
            arr = [obj];
        }
        return arr;
    }
    // ### Utils.mapAttributes
    // utility for iterating over an attributes list, picking those that begin with `data-uijet-`
    // and returns a map of the name - without the prefix - to the value OR `true` if empty
    function mapAttributes(attrs_list) {
        var obj = {},
            re = RegExp('^' + ATTR_PREFIX+ '([-_\\w]+)');
        Array.prototype.forEach.call(attrs_list, function (attr) {
            if ( ~ attr.name.search(re) ) {
                obj[attr.name.match(re)[0]] = attr.value === '' ? true : attr.value;
            }
        });
        return obj;
    }

    // ### Utils.extend
    // @sign: extend(target, source[, source1[, ...]])  
    // @sign: extend(bool, target, source[, source1[, ...]])  
    // @return: target
    //
    // Deep (or shallow) copy objects (Arrays are shallow copied).  
    // If first argument is `true` then deep copy.  
    // First (or second of first is a Boolean) argument is the target.  
    // All following arguments are source objects.  
    // Objects are copied to target from left to right.
    function extend() {
        var args = arraySlice.call(arguments),
            target = args.shift(),
            source,
            is_deep,
            s;
        if ( typeof target == 'boolean' ) {
            is_deep = target;
            target = args.shift();
        }
        while ( source = args.shift() ) {
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

    // ### Utils.extendProto
    // @sign: extendProto(target, source[, source1[, ...]])  
    // @return: target
    //
    // Deep copy (prototype) objects (Arrays are shalow copied).  
    // First argument is the target.  
    // All following arguments are source objects.  
    // Objects are copied to target from left to right.  
    // If a property of same name exists in both source and target:
    //
    // * object: deep copy.
    // * function: target method is wrapped to support a super call to the source method.
    // * else: shallow copy.
    function extendProto() {
        var args = arraySlice.call(arguments),
            target = args.shift(),
            source,
            s;
        while ( source = args.shift() ) {
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

    // ### Utils.Create
    // @sign: Create(self, [extended], [as_constructor])  
    // @sign: Create(self, [as_constructor]])  
    // @return: self (class or instance)
    //
    // Create a class with `self` specifying the top level and `extended` the rest of the prototype chain
    // using `extendProto` for inheritance.  
    // Both `self` and `extended` can be either an `Object` or a constructor function.  
    // In the latter the `prototype` property is used.  
    // If `as_constructor` flag is passed and `true` the returned result is a constructor function,  
    // otherwise it is an instance of that class.
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

    // ### uijet namespace
    uijet =  {
        ROUTE_PREFIX    : '',
        ROUTE_SUFFIX    : '',
        // ### uijet._defineWidget
        // @sign: _defineWidget(name, props, [mixins])  
        // @return: uijet
        //
        // Caches a definition of a widget inside uijet,  
        // using name as the key and props as the definition.  
        // Optional mixins argument can be supplied for defining this widget on top of a mixin.
        _defineWidget   : function (_name, _props, _mixins) {
            widget_definitions[_name] = {
                proto   : _props,
                mixins  : _mixins
            };
            return this;
        },
        // ### uijet._generateWidget
        // @sign: _generateWidget(_props, [_mixins])  
        // @return: widget_class
        //
        // Generate a widget class using `Create` with `uijet.BaseWidget` as the base prototype.
        _generateWidget : function (_props, _mixins) {
            // create the base class
            var _class = Create(this.BaseWidget, true),
                _mixin, _mixins_copy;
            // if we have mixins to mix then mix'em
            if ( _mixins && _mixins.length ) {
                _mixins_copy = _mixins.slice(0);
                while ( _mixin = _mixins_copy.shift() ) {
                    if ( mixins[_mixin] ) {
                        // like a stacking turtles
                        _class = Create(mixins[_mixin], _class, true);
                    }
                }
            }
            // put cherry on top
            return Create(_props, _class, true);
        },
        // ### uijet.Widget
        // @sign: Widget(name, props, [mixin_names])  
        // @return: uijet
        //
        // Define and generate a widget class.  
        // `mixin_names` is normalized into a list of names.
        Widget          : function (name, props, mixin_names) {
            var _mixins = toArray(mixin_names);
            // Cache the widget's definition for JIT creation
            this._defineWidget(name, props, _mixins);
            // finally create and cache the class
            widget_classes[name] = this._generateWidget(props, _mixins);
            return this;
        },
        // ### uijet.Mixin
        // @sign: Mixin(name, props)  
        // @return: uijet
        //
        // Define a mixin to be used by uijet.
        Mixin           : function (name, props) {
            mixins[name] = props;
            return this;
        },
        // ### uijet.View
        // @sign: View(name, widget)  
        // @return: uijet
        //
        // Define a view to be used by uijet.
        View            : function (name, widget) {
            views[name] = widget;
            return this;
        },
        // ### uijet.Adapter
        // @sign: Adapter(name, [adapter])  
        // @return: uijet
        //
        // Define an adapter to be used by uijet.  
        // If `name` is omitted and the `adapter` object is given as first and only argument
        // then it is used as a top level adapter which overrides all other widget instances.  
        // Useful when you need to specify your custom methods that will override all others.  
        // Internally uses the name `TopAdapter`.
        Adapter         : function (name, adapter) {
            if ( ! adapter ) {
                adapter = name;
                name = TOP_ADAPTER_NAME;
            }
            adapters[name] = adapter;
            return this;
        },
        // ### uijet.init
        // @sign: init([options])  
        // @return: uijet
        //
        // Initialize uijet.  
        // Defines all required and unimplemented methods, connects it to a template engine
        // and starts all instances of predefined widgets in the app.  
        // options:
        //
        // * __element__: selector for the containing `HTMLElement` of the application. defualt is 'body'.
        // * __methods__: `object` of methods that will be copied into uijet. Required.
        // * __methods_context__: context object to be used for binding the execution of the above mentioned methods to.
        // * __engine__: function that generates the HTML,
        //           basically a wrapper for the given template engine's render method. Required.
        // * __wigets__: widget definitions to be used by uijet.
        // * __animation_type__: default type of animation to be used across the app. default is 'slide'.
        // * __parse__: a flag instructing uijet to parse the HTML to look for widget definitions. Default is `false`.
        // * __dont_start__: a flag instructing uijet not to run `startup` as a callback to init. Default is `false`.
        // * __pre_startup__: a callback to run synchronously in the beginning of `startup`.
        init            : function (options) {
            // wrap the actuall initialization function
            var _init = function () {
                var  _methods = {},
                    that = this,
                    k, _widgets;
                this.options = options;
                // set top container
                this.$element = $(options && options.element || 'body');
                // sniff for iPad UA and perform optimizations accordingly
                this.isiPad();
                // initially not using a router
                this.options.routed = false;
                if ( options ) {
                    if ( options.route_prefix ) {
                        this.ROUTE_PREFIX = options.route_prefix;
                    }
                    if ( options.route_suffix ) {
                        this.ROUTE_SUFFIX = options.route_suffix;
                    }
                    if ( _methods = options.methods ) {
                        if ( options.methods_context ) {
                            // bind each method to given context
                            for ( k in _methods ) {
                                _methods[k] = _methods[k].bind(options.methods_context);
                                k == 'setRoute' && (this.options.routed = true);
                            }
                        }
                        // implement missing methods
                        extend(this, _methods);
                    }
                    if ( options.engine ) {
                        //TODO: implement hacking into BaseWidget.prototype better  
                        // set the template engine hook
                        this.BaseWidget.prototype.generate = options.engine;
                    } else {
                        throw new Error('Template engine not specified');
                    }
                    // set default animation type
                    this.options.animation_type = options.animation_type || 'slide';
                    // if the user told us to look in the DOM
                    if ( options.parse ) {
                        this.dfrd_parsing = $.Deferred();
                        // parse the DOM for widgets
                        this.parse();
                    }
                    // if we have widgets defined
                    if ( _widgets = this.options.widgets ) {
                        this.dfrd_starting = $.Deferred();
                        // build and init them
                        this.startWidgets(_widgets);
                    }
                    // after all parsing, loading, build and initializing was done
                    $.when(
                        this.dfrd_parsing ? this.dfrd_parsing.promise() : {},
                        this.dfrd_starting ? this.dfrd_starting.promise() : {}
                    ).then(function () {
                        // kick-start the GUI - unless ordered not to
                        options.dont_start || that.startup();
                    });
                } else {
                    // no options - kick-start
                    this.startup();
                }
                return this;
            };
            // if we're in AMD mode
            if ( typeof _window.require == 'function' ) {
                // import all the modules we need (Mixins, Widgets, Adapters, 3rd party...)  
                // and initialization will start when done
                return this.importModules(options.widgets, _init.bind(this, options));
            } else {
                // otherwise just init
                return _init.call(this, options);
            }
        },
        // ### uijet.registerWidget
        // @sign: registerWidget(widget)  
        // @return: uijet
        //
        // Registers a widget into uijet's widgets tree.
        registerWidget  : function (widget) {
            // get the parent element
            var $parent = widget.$element.parent(),
                // create the registry object
                _current = {
                    self        : widget,
                    contained   : []
                },
                _id = widget.id,
                _parent_id;
            // add registry object to the sandbox's store
            widgets[_id] = _current;
            // walk the DOM tree upwards until we hit 'body'
            while ( $parent.length && ! $parent.is('body') ) {
                // if we hit a `uijet_widget`
                if ( $parent.hasClass('uijet_widget') ) {
                    // get its `id`
                    _parent_id = $parent[0].id;
                    // and set it as the container in this registry
                    _current.container = _parent_id;
                    if ( _parent_id in widgets ) {
                        // if the parent is registered then add this widget to its contained
                        widgets[_parent_id].contained.push(_id);
                    }
                    //bail out
                    break;
                }
                // keep walking
                $parent = $parent.parent();
            }
            return this;
        },
        // ## uijet.unregisterWidget
        // @sign: unregisterWidget(widget)  
        // @return: uijet
        //
        // Unregisters a widget from uijet's widgets tree.
        unregisterWidget: function (widget) {
            var _id = widget.id, registration, _parent_contained;
            if ( _id in widgets ) {
                registration = widgets[_id];
                if ( registration.container ) {
                    _parent_contained = widgets[registration.container].contained;
                    // remove this widget's `id` from its container's contained registry
                    _parent_contained.splice(_parent_contained.indexOf(_id), 1);
                }
                // remove its registry
                delete widgets[_id];
            }
            return this;
        },
        // ## uijet.startWidget
        // @sign: startWidget(type, config)  
        // @return: deferred_start OR uijet
        //
        // Builds an instance of a widget using a cached definition.  
        // If defined AMD style it will load all dependencies first.  
        // This instance will be initialized and registered into uijet at the end.  
        // `type` is a string representing the widget's type.  
        // `config` is additional options to add to that instance:
        //
        // * __mixins__: a `String` name of a mixin or an `Array` of names of mixins to add to this instance build.
        // * __adapters__: a list of names of mixins to add to this instance.
        startWidget     : function (_type, _config, _skip_import) {
            var that = this,
                _dfrd_start, _self, _w, l, _d, _c, _mixins, _adapters;
            // if not `true` then import dependencies first and then do the starting
            if ( ! _skip_import ) {
                _dfrd_start = $.Deferred();
                // the import's callback
                _self = function () {
                    that.startWidget(_type, _config, true);
                    _dfrd_start.resolve();
                    return this;
                };
                // do import
                this.importModules([{type: _type, config: _config}], _self);
                return _dfrd_start.promise();
            } else {
                // do start  
                // if we have mixins configred to mix
                if ( _mixins = toArray(_config.mixins) ) {
                    // get the stored widget class
                    _d = widget_definitions[_type];
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
                if ( _adapters = toArray(_config.adapters) ) {
                    l = _adapters.length;
                    // extend this instance with these adapters
                    while ( l-- ) {
                        extend(_w, adapters[_adapters[l]]);
                    }
                }
                // check for a top-adapter
                if ( adapters[TOP_ADAPTER_NAME] ) {
                    // extend this instance with the top-adapter
                    extend(_w, adapters[TOP_ADAPTER_NAME]);
                }
                // init the instance
                _w.init(_config);
                // register this instance to the uijet sandbox
                this.registerWidget(_w);
            }
            return this;
        },
        // ## uijet.importModules
        // @sign: importModules(widgets, callback)  
        // @return: require() OR callback() OR uijet
        //
        // Takes an `Array` of widget definitions - `widgets` (type & config), derives the dependencies from
        // each definition into a list of modules to load.  
        // At the end checks for any module that's not already loaded and loads them.  
        // If it needs to load anything it fires `callback` after load is finished,
        // If there's nothing to load or AMD isn't in use it returns the call to `callback` OR `uijet`.
        importModules   : function (_widgets, callback) {
            var deps = [],
                // modules paths
                widgets_prefix = 'uijet_dir/widgets/',
                adapters_prefix = 'uijet_dir/adapters/',
                mixins_prefix = 'uijet_dir/mixins/',
                _w, _m, _m_type, _m_list;
            // if using AMD
            if ( typeof _window.require == 'function' ) {
                // iterate over list of widgets
                for ( var i = 0 ; _w = _widgets[i] ; i++ ) {
                    // build widget's path
                    _m_type = widgets_prefix + _w.type;
                    // if this widget type wasn't loaded and isn't in the dependencies list then add it
                    (widgets[_w.type] || ~ deps.indexOf(_m_type)) || deps.push(_m_type);
                    // check for adapters option
                    if ( _m_list = _w.config.adapters ) {
                        // if it's an `Array` of adapters
                        if ( isArr(_m_list) ) {
                            for ( var n = 0 ; _m = _m_list[n++] ; ) {
                                // grab each one and add it if it wasn't loaded before and not already in the list
                                _m_type = adapters_prefix + _m;
                                (adapters[_m_list] || ~ deps.indexOf(_m_type)) || deps.push(_m_type);
                            }
                        } else {
                            // otherwise it's a string
                            _m_type = adapters_prefix + _m_list;
                            // if not in the list and not loaded before add it
                            (adapters[_m_list] || ~ deps.indexOf(_m_type)) || deps.push(_m_type);
                        }
                    }
                    // check for mixins option and give it the same treatment like we did with adapters
                    if ( _m_list = _w.config.mixins ) {
                        if ( isArr(_m_list) ) {
                            for ( n = 0 ; _m = _m_list[n++] ; ) {
                                _m_type = mixins_prefix + _m;
                                (mixins[_m_list] || ~ deps.indexOf(_m_type)) || deps.push(_m_type);
                            }
                        } else {
                            (mixins[_m_list] || ~ deps.indexOf(_m_type)) || deps.push(mixins_prefix + _m_list);
                        }
                    }
                }
                // if there's anything to import
                if ( deps.length ) {
                    // import it
                    return _window.require(deps, callback);
                }
            }
            // if nothing to import or not using AMD
            // then fire `callback` and return it or simply `uijet`
            return callback ? callback() : this;
        },
        // ## uijet.startWidgets
        // @sign: startWidgets(widgets)  
        // @return: uijet
        //
        // Accepts an `Array` of widgets definitions and starts them one by one.  
        // Since `uijet.startWidget()` returns a promise object that's resolved after widget's dependencies
        // are all imported and it has been started, it also resolves `this.dfrd_starting` promise obejct
        // which holds the `uijet.init()` flow before `startup` is called.
        startWidgets    : function (_widgets) {
            var i = 0,
                that = this,
                dfrd_starts = [],
                _c;
            while ( _c = _widgets[i] ) {
                dfrd_starts[i] = this.startWidget(_c.type, _c.config);
                i+=1;
            }
            $.when.apply($, dfrd_starts).then(function () {
                that.dfrd_starting.resolve();
            });
            return this;
        },
        // ## uijet.startup
        // @sign: startup()  
        // @return: uijet
        //
        // Starts up uijet and publishes this event across the app.  
        // If the `pre_startup` callback is defined it will run in the beginning.  
        // At the end fires the `startup` event.
        startup         : function () {
            var pre_startup = this.options.pre_startup;
            if ( typeof pre_startup == 'function' ) {
                pre_startup();
            }
            this.publish('startup');
            return this;
        },
        //TODO: consider removing this method altogether
        // ## uijet.getCurrentView
        // @sign: getCurrentView()  
        // @return: current_view_widget
        //
        // Finds current view and returns it
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
        // ## uijet.parse
        // @sign: parse()  
        // @return: uijet
        //
        // Searches the DOM, starting from the container element, for all widget definitions inside the markup
        // and starts these widgets.  
        // This method looks for the `data-uijet-type` attribute on tags.
        parse           : function () {
            var that = this;
            this.$element.find('[' + TYPE_ATTR + ']')
                .each(function () {
                    var $this = $(this),
                        _type = $this.attr(TYPE_ATTR);
                    uijet.startWidget(_type, that.parseWidget($this));
                });
            return this;
        },
        // ## uijet._parseScripts
        // @sign: _parseScripts($element, config)  
        // @return: uijet
        //
        // Looks for script tags inside the widget's element, given as a jQuery object in `$element`,
        // parses their attributes and `innerHTML` and adds them as widget options on the given `config` object.  
        // Looks for the `type` attribute to specify the type of option to be set.  
        // If the option is an event then it looks for a `data-uijet-event` attribute which specifies the type
        // of the event to be listened to.  
        // For arguments passed to the event handler it looks for a `data-uijet-args` attribute, which is a list
        // of argument names separated by ','.  
        // The body of the tag is used as the function body.  
        // Example markup:
        //
        //      <div id="my_list" data-uijet-type="List">
        //          <script type="uijet/app_event"
        //                  data-uijet-event="my_list_container_pane.post_wake"
        //                  data-uijet-args="event, data">
        //              this.wake(data);
        //          </script>
        //      </div>
        _parseScripts   : function ($el, config) {
            var F = _window.Function;
            $el.find('script').each(function () {
                var $this = $(this),
                    type = $this.attr('type'),
                    // get attributes and normalize it into an `Array`, their names and `Boolean` values
                    attrs = mapAttributes($el[0].attributes),
                    // extract the option name from the type
                    option_name = type.match(/uijet\/(\w+)/),
                    _fn_args, fn;
                // get the `string` from the matches if got any
                option_name = option_name ? option_name[0] : '';
                // if we have an `args` attribute split it to an `Array` and trim their names
                _fn_args = attrs.args && attrs.args.length ? attrs.args.split(/\s*,\s*/) : [];
                // add function body
                _fn_args.push(this.innerHTML);
                // create the function
                fn = F.apply(null, _fn_args);
                // set it as an option on the `config` object
                switch ( type ) {
                    case 'uijet/signal':
                    case 'uijet/app_event':
                    case 'uijet/dom_event':
                        option_name = option_name + 's';
                        config[option_name] = config[option_name] || {};
                        config[option_name][attrs.event] = fn;
                        break;
                    case 'uijet/initial': break;
                    case 'uijet/serializer': break;
                    case 'uijet/routing':
                        config[option_name] = fn;
                        break;
                }
                // clean the DOM
                $this.remove();
            });
            return this;
        },
        // ## uijet.parseWidget
        // @sign: parseWidget($element)  
        // @return: config
        //
        // Parses a widget's configuration from the DOM.  
        // Takes a jQuery object containing the widget's element and parses its attributes and inner script tags.  
        // For complete compliance with HTML5 and non-conflict approach it parses only attributes
        // prefixed with `data-uijet-`. The name of the attribute following this prefix is the same
        // as option it matches.  
        // For boolean options that are equal `true` you can simply use the name of that attribute with no value,
        // example:
        //
        //      <div data-uijet-type="List" data-uijet-horizontal>...</div>
        //
        // Returns a config object to be used in `uijet.startWidget()` call.  
        // For options with function as a value read the `uijet._parseScripts` docs.
        parseWidget     : function ($el) {
            var attrs = mapAttributes($el[0].attributes),
                _ops_string = attrs['config'],
                _config = {}, _pairs, l, op;
            if ( _ops_string ) {
                delete attrs['config'];
                _pairs = _ops_string.split(',');
                l = _pairs.length;
                while ( l-- ) {
                    op = _pairs[l].split(':');
                    _config[op[0].trim()] = op[1].trim();
                }
                extend(attrs, _config);
            }
            this._parseScripts($el, attrs);
            return attrs;
        },
        // ## uijet.wakeContained
        // @sign: wakeContained(id, [context])  
        // @return: deferred_widgets
        //
        // Takes an `id` of a widget and wakes all its contained widgets.  
        // Takes an options context object as a second argument.  
        // Returns an `array` of promise objects,
        // each representing the promise returned by a contained widget's `wake` call
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
        // ## uijet.sleepContained
        // @sign: sleepContained(id)  
        // @return: uijet
        //
        // Takes an `id` of a widget and sleeps all its contained widgets.
        sleepContained  : function (id) {
            var _contained = widgets[id].contained,
                l = _contained.length;
            while ( l-- ) {
                widgets[_contained[l]].self.sleep(true);
            }
            return this;
        },
        // ## uijet.destroyContained
        // @sign: destroyContained(id)  
        // @return: uijet
        //
        // Takes an `id` of a widget and destroys and unregisters all its contained widgets.
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
        // # -NOT IMPLEMENTED-
        // ## uijet.publish
        // @sign: publish(topic, [data])  
        // @return: uijet
        //
        // Publish a custom event/message across the app.  
        // Generally takes a `string` `topic` and `data` is an optional extra argument passed to event listeners.  
        // It is possible to support different argument for `topic`, i.e. `object` as a map of topics to data.
        publish         : function (topic, data) {
            throw new Error('uijet.publish not implemented');
        },
        // # -NOT IMPLEMENTED-
        // ## uijet.subscribe
        // @sign: subscribe(topic, handler, [context])
        // @return: uijet
        //
        // Subscribe an event handler to a custom event/message in app-wide context.  
        // Generally takes a `string` `topic` and a `handler` `function` to be called once `topic` is published.  
        // Takes an optional third `context` argument which can act as the `this` argument in the handler's
        // exection context.  
        // It is possible to support different argument for `topic`, i.e. `object` as a map of topics to handlers,
        // or `handler` as a `string` representing a name of a `function` in the `context` argument.
        subscribe       : function (topic, handler, context) {
            throw new Error('uijet.subscribe not implemented');
        },
        // # -NOT IMPLEMENTED-
        // ## uijet.unsubscribe
        // @sign: unsubscribe(topic, [handler], [context])  
        // @return: uijet
        //
        // Remove a subscription of an event handler to a custom event/message.  
        // If just the `topic` is supplied then all handlers subscribed to it will be removed.  
        // If a `handler` is supplied (either as a `function` or as a `string` together with the `context` argument)
        // then only that handler will be removed.
        unsubscribe     : function (topic, handler, context) {
            throw new Error('uijet.unsubscribe not implemented');
        },
        // # -NOT IMPLEMENTED-
        // ## uijet.setRoute
        // @sign: setRoute(widget, [route], [callback])  
        // @return: uijet
        //
        // Sets a route in the app that will call the widget's run method.  
        // If `route` is NOT supplied then the route is taken using `widget.getRoute()`.  
        // It is possible to supply `route` as an `object` when other characteristics of the route
        // need to be taken into account, such as the REST method, etc.
        // An optional third argument `callback` can be used to replace the default `uijet.run` method.
        // For example, if you need to set a route of a Form's submit with the send method.
        setRoute        : function (widget, route, callback) {
            throw new Error('uijet.setRoute not implemented');
        },
        // # -NOT IMPLEMENTED-
        // ## uijet.unsetRoute
        // @sign: unsetRoute(widget, [route])  
        // @return: uijet
        //
        // Removes a set route from the routes registry.  
        // Arguments can be supplied for all cases as explained for `uijet.setRoute` above.
        unsetRoute      : function (widget, route) {
            throw new Error('uijet.unsetRoute not implemented');
        },
        // # -NOT IMPLEMENTED-
        // ## uijet.runRoute
        // @sign: runRoute(route, [is_silent])  
        // @return: uijet
        //
        // Runs a set route.  
        // The second `is_silent` argument can be used to differentiate between 2 types of routing:
        //
        // 1. When `true`: call the route handler but don't propagate the route to the browsers' address bar (possible
        //    to neither push this state to the HTML5 history object.
        // 2. When `false`: Propagate this route to the address bar and the activation of the route handler will follow.
        runRoute        : function (route, is_silent) {
            throw new Error('uijet.runRoute not implemented');
        },
        // ## uijet.getRouteById
        // @sign: getRouteById(widget_id)  
        // @return: route OR null
        //
        // Takes an `id` of a widget and returns a route of the found widget OR `null`.
        getRouteById    : function (widget_id) {
            var _widget;
            for ( var w in widgets ) {
                if ( w == widget_id ) {
                    _widget = widgets[w].self;
                    return _widget.routed ? _widget.getRoute() : null;
                }
            }
            return null;
        },
        // ## uijet.isiPad
        // @sign: isiPad()  
        // @return: uijet
        //
        // Sniffs the userAgent for an iPad.  
        // If true then handles all iPad related actions,
        // such as adding the "ipad" class to the application container,
        // disabling touchmove on the entire viewport, etc.
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
        // ## uijet.animate
        // @sign: animate(widget, direction, callback)  
        // @return: uijet
        //
        // Handles widgets animation across the appliaction.  
        // Mostly transitions of widgets in and out of the view.  
        // Takes a widget to animate, a direction ("in"/"out") of the animation
        // and a callback to fire once the animation is done.  
        // This callback will usually resolve a promise waiting for the animation to end.
        animate         : function (widget, direction, callback) {
            var transit_type = widget.options.animation_type || this.options.animation_type,
                $el = (widget.$wrapper || widget.$element),
                class_name = transit_type + '_in',
                // cache the handler since we might need to call it explicitly
                transitionendHandler = function (e) {
                    if ( uijet.back_navigation === false ) {
                        $el.removeClass('transitioned reverse');
                        delete uijet.back_navigation;
                    } else {
                        $el.removeClass('transitioned');
                    }
                    callback && callback.call(widget);
                },
                is_direction_in, has_class_name, _h;

            direction = direction ||'in';
            is_direction_in = direction == 'in';

            if ( uijet.back_navigation ) {
                uijet.back_navigation = false;
                $el.addClass('reverse');
            }
            // bind just one event listener to the end of the animation
            $el.one('transitionend webkitTransitionEnd', transitionendHandler);
            // Handle height property animation specially since it's broken in browsers
            if ( 'fold' == transit_type ) {
                $el.addClass('transitioned');
                if ( is_direction_in ) {
                    _h = widget._total_height || 0;
                    if ( ! _h ) {
                        // calculate total height
                        $el.children().each(function () {
                            _h += this.offsetHeight;
                        });
                        // cache result
                        widget._total_height = _h;
                    }
                    // unfold
                    $el[0].style.height = _h + 'px';
                } else {
                    // fold
                    $el[0].style.height = 0;
                }
            } else {
                has_class_name = $el.hasClass(class_name);
                // if we're transitioning the element in and it's already in OR
                // transitioning out and it's already out
                if ( has_class_name === is_direction_in ) {
                    // just call the handler since the transition won't take place
                    transitionendHandler();
                }
                // otherwise do the animation
                else {
                    // throw the actual animation to the top of the execution queue
                    // so it is less likely to be interfered with other rendering/code execution
                    setTimeout(function () {
                        $el.addClass('transitioned').toggleClass(class_name, is_direction_in);
                    }, 0);
                }
            }
            return this;
        },
        // ## uijet.switchView
        // @sign: switchView(view)  
        // @return: uijet
        //
        // Takes a view widget and switches the current view with it.  
        // Most important, this method calls the `sleep` method of the current view.
        switchView      : function (view) {
            var _current = this.current_view;
            if ( _current !== view ) {
                _current && _current.sleep();
                this.current_view = view;
            }
            return this;
        },
        // ## uijet.switchCurrent
        // @sign: switchCurrent(widget)  
        // @return: uijet
        //
        // Takes a widget and makes sure all its siblings, who share the same direct parent DOM Node, awake
        // and are set to `current` state, do not have the `current` class set on their top element and their
        // state is switched to `awake`.  
        // At the end adds the `current` class to the widget's top element.
        switchCurrent   : function (widget) {
            var container_id = widgets[widget.id].container,
                siblings = container_id ? widgets[container_id].contained || [] : [], sibling,
                _parent = (widget.$wrapper || widget.$element)[0].parentNode,
                $top;
            for ( var l = 0; sibling = siblings[l]; l++ ) {
                sibling = widgets[sibling].self;
                if ( sibling !== widget && sibling.awake && sibling.options.state == 'current' ) {
                    $top = (sibling.$wrapper || sibling.$element);
                    if ( $top[0].parentNode === _parent ) {
                        sibling.options.state = 'awake';
                        $top.removeClass('current');
                    }
                }
            }
            widget.options.state = 'current';
            (widget.$wrapper || widget.$element).addClass('current');
            return this;
        }
    };
    // set a namespace on uijet for utility functions.
    uijet.Utils = {
        extend      : extend,
        extendProto : extendProto,
        Create      : Create,
        isObj       : isObj,
        isArr       : isArr,
        isFunc      : isFunc,
        toArray     : toArray
    };
    // return the module
    return uijet;
}));