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
    //TODO: create an adapter for XHR  
    //TODO: create an adapter for DOM events  
    // cache some gloabls
    var Function = _window.Function,
        Object = _window.Object,
        Array = _window.Array,
        BROWSER_PREFIX = { style : ['webkit', 'Moz', 'O', 'ms'], prop : ['WebKit', 'webkit', 'moz', 'o', 'ms'] },
        // native utilities caching
        objToString = Object.prototype.toString,
        arraySlice = Array.prototype.slice,
        // sandbox's registries
        mixins = {},
        adapters = {},
        declared_widgets = [],
        widgets = {},
        views = {},
        visualizers = {},
        serializers = {},
        // caching pre-built predefined widgets' classes  
        // `{ proto : widget_prototype, deps : dependencies }`
        widget_definitions = {},
        // caching built pre-defined widgets' classes
        widget_classes = {},
        // caching built and mixed-in widgets' classes
        widget_mixedin_classes = {},
        // constants
        TYPE_ATTR = 'data-uijet-type',
        ATTR_PREFIX = 'data-uijet-',
        TOP_ADAPTER_NAME = 'TopAdapter',
        getPrefixed = function (name, obj, is_prop) {
            var cases = BROWSER_PREFIX[is_prop ? 'prop' : 'style'],
                len = cases.length, prop;
            while ( len-- ) {
                if ( prop = obj[cases[len] + name] ) {
                    return prop;
                }
            }
            return null;
        },
        // a polyfill for requestAnimationFrame
        requestAnimFrame = (function () {
            return _window.requestAnimationFrame ||
                getPrefixed('RequestAnimationFrame', _window) ||
                function( callback ){
                    return _window.setTimeout(callback, 1000 / 60);
                };
        }()),
        cancelAnimFrame = (function () {
            return getPrefixed('CancelRequestAnimationFrame', _window)  ||
                getPrefixed('CancelAnimationFrame', _window)            ||
                function( requestId ){
                    return _window.clearTimeout(requestId);
                };
        }()),
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
    // a simple shim for Object.create
    if ( typeof Object.create != 'function' ) {
        Object.create = function (o) {
            if ( arguments.length > 1 ) {
                throw new Error('Object.create implementation only accepts the first parameter.');
            }
            function F () {}
            F.prototype = o;
            return new F();
        };
    }
    // shim for Array.indexOf
    if ( typeof Array.prototype.indexOf != 'function' ) {
        Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
            if ( this == null ) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if ( len === 0 ) {
                return -1;
            }
            var n = 0;
            if ( arguments.length > 0 ) {
                n = Number(arguments[1]);
                if ( n != n ) { // shortcut for verifying if it's NaN  
                    n = 0;
                } else if ( n != 0 && n != Infinity && n != -Infinity ) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if ( n >= len ) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for ( ; k < len ; k++ ) {
                if ( k in t && t[k] === searchElement ) {
                    return k;
                }
            }
            return -1;
        };
    }
    // shim String.trim
    if( typeof String.prototype.trim != 'function' ) {
        _window.String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g,'');
        };
    }
    // ### Utils.isObj
    // utility for checking if param is an Obejct
    function isObj (obj) {
        return objToString.call(obj) == '[object Object]';
    }
    // ### Utils.isArr
    // utility for checking if param is an Array
    function isArr (obj) {
        return objToString.call(obj) == '[object Array]';
    }
    // ### Utils.isFunc
    // utility for checking if param is a Function
    function isFunc (obj) {
        return typeof obj == 'function';
    }
    // ### Utils.isArgs
    // utility for checking if param is the `arguments` object
    function isArgs (obj) {
        return objToString.call(obj) == '[object Arguments]';
    }
    // ### Utils.toArray
    // utility for either wrapping a param with an `Array` or return a copy of that array  
    // if no arguments are supplied then return `undefined`
    function toArray (obj) {
        var arr;
        if ( isArgs(obj) || /object .*List/.test(objToString.call(obj)) ) {
            // convert to `Array`
            arr = arraySlice.call(obj);
        } else if ( isArr(obj) ) {
            // copy that
            arr = obj.slice(0);
        } else if ( typeof obj != 'undefined' ) {
            // wrap it
            arr = [obj];
        }
        return arr;
    }
    // ### Utils.mapAttributes
    // utility for iterating over an attributes list, picking those that begin with `data-uijet-`
    // and returns a map of the name - without the prefix - to the value OR `true` if empty
    function mapAttributes (attrs_list) {
        var obj = {},
            re = RegExp('^' + ATTR_PREFIX+ '([-_\\w]+)');
        Array.prototype.forEach.call(attrs_list, function (attr) {
            if ( ~ attr.name.search(re) ) {
                obj[attr.name.match(re)[1]] = attr.value === '' ? true : attr.value;
            }
        });
        return obj;
    }
    // ### Utils.getStyle
    // @sign: getStyle(el)
    // @return: `CSSStyleDeclaration`
    // Gets the computed style object (`CSSStyleDeclaration`) of an `HTMLElement` `el`.
    //
    // @sign: getStyle(el, prop)
    // @return: css_value
    // Gets the computed value of the given style `prop` for element `el`.
    //
    // @sign: getStyle(el, prop || `null`, pseudo)
    // @return: `CSSStyleDeclaration` OR css_value
    // Gets the computed style object of a pseudo-element `pseudo` of an `HTMLElement` `el`.
    // To get the entire style object use `null` for the `prop` argument.
    //
    // @sign: getStyle(el, prop || `null`, pseudo || `null`, win)
    // @return: `CSSStyleDeclaration` OR css_value
    // Gets the computed style object of a pseudo-element `pseudo` of an `HTMLElement` `el`, in `window` `win`.
    // To get the entire style object use `null` for the `prop` argument.
    // To get the style of the element use `null` for the `pseudo` argument.
    function getStyle (el, prop, pseudo, win) {
        var style = (win || _window).getComputedStyle(el, pseudo || null);
        return prop ? style.getPropertyValue(prop) : style;
    }
    // ### Utils.returnOf
    // Wrapper for checking if a variable is a function and return its returned value or else simply return it.
    function returnOf (arg, ctx) {
        return isFunc(arg) ? arg.apply(ctx || _window, arraySlice.call(arguments, 2)) : arg;
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
    function extend () {
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
    function extendProto () {
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

    function process (data, processor, widget) {
        var key, val;
        if ( isObj(processor) ) {
            for ( key in processor ) {
                if ( isObj(processor[key]) ) {
                    if ( isObj(data) && data.hasOwnProperty(key) ) {
                        if ( isObj(data[key]) || isArr(data[key]) ) {
                            process(data[key], processor[key], widget);
                        }
                        else {
                            data[key] = processor[key];
                        }
                    }
                    else if ( isArr(data) ) {
                        data.forEach(function (item, i) {
                            if ( isObj(item) || isArr(item) ) {
                                process(item, processor[key], widget);
                            }
                            else {
                                data[i] = processor[key];
                            }
                        });
                    }
                }
                else {
                    if ( isObj(data) ) {
                        val = returnOf(processor[key], widget, data[key], data);
                        if ( data.hasOwnProperty(key) || val !== void 0 ) {
                            data[key] = val;
                        }
                    }
                    else if ( isArr(data) ) {
                        data.forEach(function (item, i) {
                            var val;
                            if ( isObj(item) ) {
                                val = returnOf(processor[key], widget, item[key], item, i, data);
                                if ( item.hasOwnProperty(key) || val !== void 0 ) {
                                    item[key] = val
                                }
                            }
                            else {
                                data[i] = returnOf(processor[key], widget, data[i], item, i, data);
                            }
                        });
                    }
                }
            }
        }
    }

    function Base () {}

    Base.prototype = {
        constructor : Base,
        // ### instance.defer
        // @sign: defer(promise, [callback], [error])
        // @return: this
        //
        // Takes a `promise` object as first argument and calls either `callback` or `error` depending on
        // whether that promise was resolved or rejected.  
        // If `callback` is a `Function` it is used as the `done` callback for `promise`.  
        // If `callback` is a `String` and it is a name of a method of this instance, that method is used
        // as the `done` callback.  
        // If there's no such method, it is published as an app event, sending the data sent to `resolve/resolveWith`
        // to the `publish` call as data.  
        // If `error` is supplied it is treated like `callback`,
        // only it is triggered as the callback for `fail` of `promise`.  
        // All callbacks, success and failure, are run in the context of this instance.
        defer           : function (promise, callback, error) {
            var cb, err;
            // if callback param is a `String`
            if ( typeof callback == 'string' ) {
                // check if it's a method of this instance
                if ( isFunc(this[callback]) ) {
                    callback = this[callback];
                }
                // otherwise just publish it as an app event
                else {
                    cb = callback;
                    callback = function (arg) {
                        uijet.publish(cb, arg);
                    };
                }
            }
            // if we got an error param
            if ( error ) {
                // if it's a `String`
                if ( typeof error == 'string' ) {
                    // check if it's a method of this instance
                    if ( isFunc(this[error]) ) {
                        error = this[error];
                    }
                    // otherwise publish it as an app event
                    else {
                        err = error;
                        error = function (arg) {
                            uijet.publish(err, arg);
                        };
                    }
                }
            }
            uijet.when(promise)
                .then(callback.bind(this), error && error.bind(this));
            return this;
        },
        // ### widget.listen
        // @sign: listen(topic, handler)  
        // @return: this
        //
        // Sets a `handler` function on the given signal with `topic` as its type.
        listen          : function (topic, handler) {
            this.signals_cache[topic] = handler;
            return this;
        },
        // ### widget.unlisten
        // @sign: unlisten(topic)  
        // @return: this
        //
        // Removes a handler from the given signal with `topic` as its type.
        unlisten        : function (topic) {
            if ( this.signals_cache[topic] ) {
                delete this.signals[topic];
                delete this.signals_cache[topic];
            }
            return this;
        },
        // ### widget.notify
        // @sign: notify(topic [, args]) OR notify(persist, topic [, args])  
        // @return: handler() OR undefined
        //
        // Triggers a signal's handler using `topic` as its type, and returns the result of that call.  
        // If the first argument supplied to `notify` is a `Boolean` it is used to determine whether
        // multiple calls can be made to this type during the same single call to a _lifecycle_ method.  
        // All subsequent arguments are sent to the handler as parameters.  
        // If the `topic` isn't found or it has fired and not set as persistent, then nothing happens
        // and `undefined` is returned.
        notify          : function (topic) {
            var handler, own_args_len = 1, args, persist = false;
            // if first argument is a boolean it means it's a directive to whether persist this signal or not
            if ( typeof topic == 'boolean' && topic ) {
                persist = true;
                handler = this.signals[arguments[1]];
                own_args_len += 1;
            } else {
                handler = this.signals[topic];
            }
            if ( handler ) {
                args = arraySlice.call(arguments, own_args_len);
                // if not to persist then mask this signal's handler with null
                persist || (this.signals[topic] = null);
                return handler.apply(this, args);
            }
        },
        // ### widget.subscribe
        // @sign: subscribe(topic, handler)  
        // @return: this
        //
        // Subscribes a `handler` to a custom event with `topic` as type.  
        // It's a hook into `uijet.subscribe` only the `handler` is bound to `this`.  
        //TODO: change the implementation to support an array of handlers per topic so this won't simply replace existing handlers
        subscribe       : function (topic, handler) {
            var _h = handler.bind(this);
            // add this handler to `app_events` to allow quick unsubscribing later
            this.app_events[topic] = _h;
            uijet.subscribe(topic, _h);
            return this;
        },
        // ### widget.unsubscribe
        // @sign: unsubscribe(topic, [handler])  
        // @return: this
        //
        // Unsubscribes a handler of a custom event with `topic` as type, if `handler` is supplied, OR
        // all handlers under that `topic`.  
        // It's a hook into `uijet.unsubscribe`.
        unsubscribe     : function (topic, handler) {
            uijet.unsubscribe(topic, handler);
            return this;
        },
        // ### widget.publish
        // @sign: publish(topic, [data], [is_global])  
        // @return: this
        //
        // Triggers a custom event with type `topic`, handing it `data` as an argument.  
        // If `is_global` is NOT set to `true` then the topic is prefixed with `this.id` and a '.'.  
        // It's a hook into `uijet.publish`.
        publish         : function (topic, data, global) {
            topic = global ? topic : this.id + '.' + topic;
            uijet.publish(topic, data);
            return this;
        },
        // ### widget.visualize
        // @sign: visualize(data)  
        // @return: this
        //
        // Takes an `Object` or an `Array` and visualizes it using the visualizers configured in the `visualizers` option.
        visualize       : function (data) {
            if ( this.options.visualizers ) {
                uijet.visualize(data, this.options.visualizers, this);
            }
            return this;
        },
        // ### widget.serialize
        // @sign: serialize(data)  
        // @return: this
        //
        // Takes an `Object` or an `Array` and serializes it using the serializers configured in the `serializers` option.
        serialize       : function (data) {
            if ( this.options.serializers ) {
                uijet.serialize(data, this.options.serializers, this);
            }
            return this;
        }
    };

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
    function Create (proto, _extends, as_constructor) {
        var is_proto_f = isFunc(proto),
            is_extends_f = isFunc(_extends),
            _proto = is_proto_f ? proto.prototype : proto;
        function F () {}
        if ( typeof _extends == 'boolean' ) {
            as_constructor = _extends; _extends = null;
        }
        if ( _extends ) {
            _proto = extendProto(
                Object.create(is_extends_f ? _extends.prototype : _extends),
                _proto
            );
        }
        F.prototype = _proto;
        _proto.constructor = is_proto_f ? proto : is_extends_f ? _extends : F;
        return as_constructor ? F : new F();
    }

    // ### Utils.getStyleProperty
    // @sign: getStyleProperty(prop)  
    // @return: prefixed_prop OR `null`
    //
    // Checks whether a CSS feature is supported in the browser
    // and if so, return its supported name, i.e. with vendor prefix, if needed.
    // Otherwise it returns `null` to indicate a lack of support.
    function getStyleProperty (prop) {
        var style = _window.document.body.style,
            cases = BROWSER_PREFIX.style,
            prefix, res, i = 0;
        if ( prop in style) return prop;
        prop = prop[0].toUpperCase() + prop.slice(1);
        while ( prefix = cases[i++] ) {
            if ( (prefix +  prop) in style )
                return prefix +  prop;
        }
        return null;
    }

    // ### Utils.getOffsetOf
    // @sign: getOffsetOf(child, parent)  
    // @return: offset_obj
    //
    // Returns the offset in pixels of an element from another element as an `Object`
    // with the keys `x` and `y` and its left and top values corresponding.  
    // If `child` is not a descendant of `parent` then the values will both be 0.
    function getOffsetOf (child, parent) {
        var result = { x: 0, y: 0 };
        //TODO: uses jQuery.contains - might wanna lose it later
        if ( ! child || ! parent || child === parent || ! $.contains(parent, child) ) return result;
        do {
            if ( child === parent ) break;
            result.x += child.offsetLeft;
            result.y += child.offsetTop;
        } while ( child = child.offsetParent );
        return result;
    }
    // ### uijet namespace
    uijet =  {
        ROUTE_PREFIX        : '',
        ROUTE_SUFFIX        : '',
        // detected browser features
        support             : {
            touch           : (function () {
                return ('ontouchstart' in _window) || _window.DocumentTouch && document instanceof DocumentTouch;
            }()),
            transform       : !!getStyleProperty('transform'),
            transition      : !!getStyleProperty('transition'),
            '3d'            : !!getStyleProperty('perspective'),
            transitionend   : (function (name) {
                return name ? ({
                    transition      : 'transitionend',
                    MozTransition   : 'transitionend',
                    webkitTransition: 'webkitTransitionEnd',
                    OTransition     : 'OTransitionEnd',
                    msTransition    : 'MSTransitionEnd'
                })[name] : name;
            }([getStyleProperty('transition')]))
        },
        // ### uijet.use
        // @sign: use(props, host, [context])  
        // @return: uijet
        //
        // Adds functionality to another object `host` by extending it with the `props` object.  
        // If `host` is not specified or `null` it's the `uijet` object by default.  
        // If `context` object is specified the properties of `props` are coppied and all methods will be bound to it.
        use                 : function (props, host, context) {
            // get the host object or use uijet
            var _host = host || this, m, dup;
            // if `context` is an `object`
            if ( isObj(context) ) {
                dup = {};
                // loop over `props`
                for ( m in props ) {
                    // create a duplicate of `props` and bind every method to `context`
                    dup[m] = isFunc(props[m]) ? props[m].bind(context) : props[m];
                }
            }
            // extend `host` with the duplicate or simply `props`
            extend(true, _host, dup || props);
            return this;
        },
        // ### uijet.Widget
        // @sign: Widget(name, props, [deps])  
        // @return: uijet
        //
        // Define and generate a widget class.  
        // `deps` is normalized into a list of names if it's a `String`.  
        // If `deps` is an `Object` it has to contain a `mixins` and/or `widgets` keys
        // which values will also be normalized into `Array`s.
        Widget              : function (name, props, mixin_names) {
            var mixins_as_obj = isObj(mixin_names),
                _mixins;
            if ( mixins_as_obj ) {
                _mixins = {};
                _mixins.mixins = toArray(mixin_names.mixins);
                _mixins.widgets = toArray(mixin_names.widgets);
            } else {
                _mixins = toArray(mixin_names);
            }
            // Cache the widget's definition for JIT creation
            this._defineWidget(name, props, _mixins);
            // finally create and cache the class
            widget_classes[name] = mixins_as_obj ?
                this._generateWidget(props, _mixins.mixins, _mixins.widgets) :
                this._generateWidget(props, _mixins);
            return this;
        },
        // ### uijet.Mixin
        // @sign: Mixin(name, props)  
        // @return: uijet
        //
        // Define a mixin to be used by uijet.
        Mixin               : function (name, props) {
            mixins[name] = props;
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
        Adapter             : function (name, adapter) {
            if ( ! adapter ) {
                adapter = name;
                name = TOP_ADAPTER_NAME;
            }
            adapters[name] = adapter;
            return this;
        },
        // ### uijet.Serializer
        // @sign: Serializer(name, serializer)  
        // @return: uijet
        //
        // Define an serializer to be used by uijet.
        Serializer          : function (name, config) {
            serializers[name] = config;
            return this;
        },
        // ### uijet.Visualizer
        // @sign: Visualizer(name, visualizer)  
        // @return: uijet
        //
        // Define an visualizer to be used by uijet.
        Visualizer          : function (name, config) {
            visualizers[name] = config;
            return this;
        },
        // ### uijet.View
        // @sign: View(name, widget)  
        // @return: uijet
        //
        // Define and register a view to be used by uijet.
        View                : function (name, widget) {
            views[name] = widget;
            return this;
        },
        // ### uijet.Form
        // @sign: Form(name, widget)  
        // @return: uijet
        //
        // Set a form's route to connect its submission with the widget's `send` method.
        Form                : function (name, widget) {
            this.options.routed ?
                this.setRoute(widget, widget.getSendRoute(), 'send') :
                this.subscribe(widget.id + '.submitted', widget.send, widget);
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
        // * __submit_handled__: whether your code or some other 3rd party (e.g. Sammy.js) is handling routing of submit
        //                      events. Default is `false`.
        init                : function (options) {
            // wrap the actuall initialization function
            var _init = function (_options) {
                var _methods = {},
                    that = this,
                    k;
                this.options = _options || {};
                // set top container
                this.$element = $(_options && _options.element || 'body');
                // sniff for iPad UA and perform optimizations accordingly
                this.isiPad();
                if ( _options ) {
                    if ( _options.route_prefix ) {
                        this.ROUTE_PREFIX = _options.route_prefix;
                    }
                    if ( _options.route_suffix ) {
                        this.ROUTE_SUFFIX = _options.route_suffix;
                    }
                    try {
                        this.setRoute();
                        this.options.routed = true;
                    }
                    catch (e) {
                        this.options.routed = false;
                    }
                    // set default animation type
                    this.options.animation_type = _options.animation_type || 'slide';
                    // if the user told us to look in the DOM
                    if ( _options.parse ) {
                        this.dfrd_parsing = this.Promise();
                        // parse the DOM for widgets
                        this.parse();
                    }
                    // after all parsing, loading, build and initializing was done
                    this.when(
                        // when finished parsing all widgets declarations in the HTML
                        this.dfrd_parsing ? this.dfrd_parsing.promise() : {}

                    ).then(function () {
                        // when parsing is done (or skipped)
                        that.when(
                            // build and init declared widgets
                            that.startWidgets(declared_widgets)

                        ).then(function () {
                            //when all declared widgets are initialized, set `uijet.initialized` to `true`
                            that.initialized = true;
                            // kick-start the GUI - unless ordered not to
                            _options.dont_start || that.startup();
                        });
                    });
                } else {
                    this.initialized = true;
                    // no options - kick-start
                    this.startup();
                }
                return this;
            };
            // if we have widgets defined
            if ( options && isArr(options.widgets) ) {
                // add these to the declared ones
                this.declareWidgets(options.widgets);
            }
            // if we're in AMD mode
            if ( typeof _window.require == 'function' ) {
                // import all the modules we need (Mixins, Widgets, Adapters, 3rd party...)  
                // and initialization will start when done
                return this.importModules(declared_widgets, _init.bind(this, options));
            } else {
                // otherwise just init
                return _init.call(this, options);
            }
        },
        // ### uijet._defineWidget
        // @sign: _defineWidget(name, props, [deps])  
        // @return: uijet
        //
        // Caches a definition of a widget inside uijet,
        // using `name` as the key and `props` as the definition.  
        // Optional `deps` argument can be supplied for defining this widget on top of mixins and/or other widgets.
        _defineWidget       : function (_name, _props, _deps) {
            widget_definitions[_name] = {
                proto   : _props,
                deps    : _deps
            };
            return this;
        },
        // ### uijet._generateWidget
        // @sign: _generateWidget(_props, [_mixins], [_widgets])  
        // @return: widget_class
        //
        // Generate a widget class using `Create` with `uijet.BaseWidget` as the base prototype.
        _generateWidget     : function (_props, _mixins, _widgets) {
            // create the base class
            var _class = Create(this.BaseWidget, true),
                _mixin, _mixins_copy,
                _widget, _widgets_copy;
            // if we have widgets to build on then mix'em
            if ( _widgets && _widgets.length ) {
                _widgets_copy = toArray(_widgets);
                while ( _widget = _widgets_copy.shift() ) {
                    if ( widget_definitions[_widget] ) {
                        // just like stacking turtles
                        _class = Create(widget_definitions[_widget].proto, _class, true);
                    }
                }
            }
            // now we add this widget to the stack
            _class = Create(_props, _class, true);
            // if we have mixins to mix then mix'em
            if ( _mixins && _mixins.length ) {
                _mixins_copy = toArray(_mixins);
                while ( _mixin = _mixins_copy.shift() ) {
                    if ( mixins[_mixin] ) {
                        // stack those madafakas
                        _class = Create(mixins[_mixin], _class, true);
                    }
                }
            }
            return _class;
        },
        // ### uijet.registerWidget
        // @sign: registerWidget(widget)  
        // @return: uijet
        //
        // Registers a widget into uijet's widgets tree.
        registerWidget      : function (widget) {
            // get the parent element
            var _parent = null,
                // create the registry object
                _current = {
                    self        : widget,
                    contained   : []
                },
                _id = widget.id,
                _body = _window.document.body,
                _parent_id, _container;
            // add registry object to the sandbox's store
            // if the registry exists
            if ( _id in widgets ) {
                // if there's an instance
                if ( widgets[_id].self ) {
                    // destroy!
                    widgets[_id].self.destroy();
                    // since desrtoy just unregistered this widget
                    widgets[_id] = _current;
                }
                else {
                    // set reference to the widget's instance
                    widgets[_id].self = widget;
                    // init contained if needed
                    widgets[_id].contained || (widgets[_id].contained = []);
                }
            }
            // or create a new registry
            else {
                widgets[_id] = _current;
            }
            // if the `container` option is set use it to override the container
            if ( _container = widget.options.container ) {
                // if it's an `HTMLElement` then try getting its `id` attribute
                if ( _container.nodeType === 1 ) {
                    // try getting the `id` attribute from this element
                    _container = _container.getAttribute('id');
                }
                // if we have a valid container id
                if ( _container && typeof _container == 'string' ) {
                    widgets[_id].container = _container;
                    // if this container is registered
                    if ( _container in widgets ) {
                        // add this widget's id to the list of contained widgets of this container's registry
                        widgets[_container].contained.push(_id);
                        return this;
                    }
                    // if not
                    else {
                        // add it to the registry
                        widgets[_container] = {
                            contained   : [_id]
                        };
                    }
                }
            }
            // or set `_parent` and start traversing up the DOM tree
            else {
                _parent = widget.$element[0].parentNode;
            }
            // walk the DOM tree upwards until we hit `body`
            while ( _parent && _parent !== _body ) {
                // if we hit a `uijet_widget`
                if ( ~ _parent.className.indexOf('uijet_widget') ) {
                    // get its `id`.  
                    // important to get the attribute and not do `element.id`, since it might break
                    // when the element is a `<form>` and has an `<input name=id>`.
                    _parent_id = _parent.getAttribute('id');
                    // and set it as the container in this registry
                    _current.container = _parent_id;
                    if ( _parent_id in widgets ) {
                        // if the parent is registered then add this widget to its contained
                        widgets[_parent_id].contained.push(_id);
                    }
                    // if the parent is not in the registry then add it
                    else {
                        widgets[_parent_id] = {
                            contained   : [_id]
                        };
                    }
                    //bail out
                    break;
                }
                // keep walking
                _parent = _parent.parentNode;
            }
            return this;
        },
        // ## uijet.unregisterWidget
        // @sign: unregisterWidget(widget)  
        // @return: uijet
        //
        // Unregisters a widget from uijet's widgets tree.
        unregisterWidget    : function (widget) {
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
        // ## uijet.declareWidgets
        // @sign: declareWidgets(widgets)  
        // @return: uijet
        //
        // Declare one or more widgets that will be started once the app is initialized.  
        // `widgets` can be either an `Object` containing a widget's declaration (type and config)
        // or an `Array` of such objects.
        declareWidgets      : function (_widgets) {
            if ( isObj(_widgets) ) {
                declared_widgets.push(_widgets);
            } else if ( isArr(_widgets) ) {
                declared_widgets = declared_widgets.concat(_widgets);
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
        startWidget         : function (_type, _config, _skip_import) {
            var that = this,
                _dfrd_start, _self, mixedin_type, _w, l, _d, _c, _mixins, _adapters, _widgets;
            // if not `true` then import dependencies first and then do the starting
            if ( ! _skip_import ) {
                _dfrd_start = this.Promise();
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
                // if we have mixins configured to mix
                if ( _mixins = toArray(_config.mixins) ) {
                    // get the stored widget class
                    _d = widget_definitions[_type];
                    // concatenate the list of mixins to use
                    if ( _d.deps ) {
                        if ( isObj(_d.deps) ) {
                            _widgets = _d.deps.widgets;
                            _d.deps.mixins && (_mixins = _d.deps.mixins.concat(_mixins));
                        }
                        else {
                            _mixins = _d.deps.concat(_mixins);
                        }
                    }
                    // generate a cache key from this recipe
                    mixedin_type = _type + (_widgets ? _widgets.join('') : '') + _mixins.join('');
                    // check if it exists in cache
                    if ( mixedin_type in widget_mixedin_classes ) {
                        // if we have a cached dish then serve it
                        _c = widget_mixedin_classes[mixedin_type];
                    }
                    else {
                        // create a new class from the joined definitions
                        _c = this._generateWidget(_d.proto, _mixins, _widgets);
                        // and cache it
                        widget_mixedin_classes[mixedin_type] = _c;
                    }
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
                        extend(true, _w, adapters[_adapters[l]]);
                    }
                }
                // check for a top-adapter
                if ( adapters[TOP_ADAPTER_NAME] ) {
                    // extend this instance with the top-adapter
                    extend(true, _w, adapters[TOP_ADAPTER_NAME]);
                }
                // init the instance
                _w.init(_config);
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
        importModules       : function (_widgets, callback) {
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
                    (widget_classes[_w.type] || ~ deps.indexOf(_m_type)) || deps.push(_m_type);
                    // check for adapters option
                    if ( _m_list = toArray(_w.config.adapters) ) {
                        for ( var n = 0 ; _m = _m_list[n++] ; ) {
                            // grab each one and add it if it wasn't loaded before and not already in the list
                            _m_type = adapters_prefix + _m;
                            (adapters[_m] || ~ deps.indexOf(_m_type)) || deps.push(_m_type);
                        }
                    }
                    // check for mixins option and give it the same treatment like we did with adapters
                    if ( _m_list = toArray(_w.config.mixins) ) {
                        for ( n = 0 ; _m = _m_list[n++] ; ) {
                            _m_type = mixins_prefix + _m;
                            (mixins[_m] || ~ deps.indexOf(_m_type)) || deps.push(_m_type);
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
        // @return: promise
        //
        // Accepts an `Array` of widgets definitions and starts them one by one.  
        // Returns a promise that's resolved after all the `widgets` started successfully or
        // rejects this promise if there's an error.
        startWidgets        : function (_widgets) {
            var i = 0,
                that = this,
                dfrd = this.Promise(),
                dfrd_starts = [],
                _c;
            while ( _c = _widgets[i] ) {
                dfrd_starts[i] = this.startWidget(_c.type, _c.config);
                i+=1;
            }
            this.when.apply(this, dfrd_starts).then(function () {
                dfrd.resolve();
            }, function () {
                dfrd.reject();
            });
            return dfrd.promise();
        },
        // ## uijet.startup
        // @sign: startup()  
        // @return: uijet
        //
        // Starts up uijet and publishes this event across the app.  
        // If the `pre_startup` callback is defined it will run in the beginning.  
        // At the end fires the `startup` event.
        startup             : function () {
            var pre_startup = this.options.pre_startup;
            isFunc(pre_startup) && pre_startup();
            // listen to clicks around the app to notify about idle user interaction
            uijet.$element.click(function () {
                uijet.publish('app.clicked');
            });
            this.$element[0].style.visibility = 'visible';
            this.publish('startup');
            return this;
        },
        // ## uijet.parse
        // @sign: parse()  
        // @return: uijet
        //
        // Searches the DOM, starting from the container element, for all widget definitions inside the markup
        // and starts these widgets.  
        // This method looks for the `data-uijet-type` attribute on tags.
        parse               : function () {
            var that = this;
            this.$element.find('[' + TYPE_ATTR + ']')
                .each(function () {
                    var $this = $(this),
                        _type = $this.attr(TYPE_ATTR);
                    uijet.initialized ?
                        uijet.startWidget(_type, that.parseWidget($this)) :
                        uijet.declareWidgets({ type : _type, config : that.parseWidget($this) });
                });
            ! this.initialized && this.dfrd_parsing && this.dfrd_parsing.resolve();
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
        _parseScripts       : function ($el, config) {
            var F = _window.Function;
            $el.find('script').each(function () {
                var $this = $(this),
                    type = $this.attr('type'),
                    // get attributes and normalize it into an `Array`, their names and `Boolean` values
                    attrs = mapAttributes($this[0].attributes),
                    // extract the option name from the type
                    option_name = type.match(/uijet\/(\w+)/),
                    _fn_args, fn;
                // get the `string` from the matches if got any
                option_name = option_name ? option_name[1] : '';
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
                    case 'uijet/initial':
                    case 'uijet/serializer':
                    case 'uijet/style':
                    case 'uijet/position':
                    case 'uijet/data_url':
                    case 'uijet/send_url':
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
        parseWidget         : function ($el) {
            var attrs = mapAttributes($el[0].attributes),
                _ops_string = attrs['config'],
                _config;
            if ( _ops_string ) {
                delete attrs['config'];
                try {
                    _config = JSON.parse(_ops_string);
                } catch (e) {}
                extend(attrs, _config);
            }
            this._parseScripts($el, attrs);
            attrs['element'] = $el;
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
        wakeContained       : function  (id, context) {
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
        sleepContained      : function (id) {
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
        // Takes an `id` of a widget and destroys all its contained widgets.
        destroyContained    : function (id) {
            var _contained, l, _w;
            if ( id in widgets ) {
                _contained = widgets[id].contained;
                l = _contained.length;
                while ( l-- ) {
                    if ( _contained[l] in widgets ) {
                        _w = widgets[_contained[l]].self;
                        _w.destroy();
                    }
                }
            }
            return this;
        },
        // ## uijet.visualize
        // @sign: visualize(data, visualizers, [widget])  
        // @return: uijet
        //
        // Takes a `data` object and a name or a list of names of visualizers and uses those visualizers to process
        // that data.  
        // Takes an optional third argument `widget` - an instance object - that can be used as the context for evaluating
        // the visualizers' callbacks.
        visualize           : function (data, vizers, widget) {
            this._process_data(visualizers, data, vizers, widget);
            return this;
        },
        // ## uijet.serialize
        // @sign: serialize(data, serializers, [widget])  
        // @return: uijet
        //
        // Takes a `data` object and a name or a list of names of serializers and uses those serializers to process
        // that data.
        // Takes an optional third argument `widget` - an instance object - that can be used as the context for evaluating
        // the serializers' callbacks.
        serialize           : function (data, sezers, widget) {
            this._process_data(serializers, data, sezers, widget);
            return this;
        },
        // ## uijet._process_data
        // @sign: visualize(data, names, [widget])  
        // @return: uijet
        //
        // Takes a `data` object and a name or a list of names of visualizers and uses those visualizers to process
        // this data.
        _process_data       : function (processors, data, using, widget) {
            var name;
            using = toArray(using);
            // loop over the processors' names we have to use
            while ( name = using.shift() ) {
                // if this processor exist in the given group
                if ( name in processors ) {
                    // process it
                    process(data, processors[name], widget);
                }
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
        publish             : function (topic, data) {
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
        subscribe           : function (topic, handler, context) {
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
        unsubscribe         : function (topic, handler, context) {
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
        setRoute            : function (widget, route, callback) {
            throw new Error('uijet.setRoute not implemented');
        },
        // # -NOT IMPLEMENTED-
        // ## uijet.unsetRoute
        // @sign: unsetRoute(widget, [route])  
        // @return: uijet
        //
        // Removes a set route from the routes registry.  
        // Arguments can be supplied for all cases as explained for `uijet.setRoute` above.
        unsetRoute          : function (widget, route) {
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
        runRoute            : function (route, is_silent) {
            throw new Error('uijet.runRoute not implemented');
        },
        // ## uijet.getRouteById
        // @sign: getRouteById(widget_id)  
        // @return: route OR null
        //
        // Takes an `id` of a widget and returns a route of the found widget OR `null`.
        getRouteById        : function (widget_id) {
            var _widget;
            for ( var w in widgets ) {
                if ( w == widget_id ) {
                    _widget = widgets[w].self;
                    return _widget.routed ? _widget.getRoute() : null;
                }
            }
            return null;
        },
        // ## uijet.getCurrentViewRoute
        // @sign: getCurrentViewRoute()  
        // @return: current_view_route
        //
        // Finds current view and returns its route
        getCurrentViewRoute : function () {
            var _current = this.current_view, v;
            if ( ! _current ) {
                for ( v in views ) {
                    if ( views[v].options.state == 'current' ) {
                        _current = views[v];
                        break;
                    }
                }
            }
            return _current && _current.getRoute();
        },
        // ## uijet.isiPad
        // @sign: isiPad()  
        // @return: uijet
        //
        // Sniffs the userAgent for an iPad.  
        // If true then handles all iPad related actions,
        // such as adding the "ipad" class to the application container,
        // disabling touchmove on the entire viewport, etc.
        isiPad              : function () {
            // sniff userAgent for iPad
            if ( ~ navigator.userAgent.search(/iPad/i) ) {
                this.$element.addClass('ipad');
                this.is_iPad = true;
            }
            // prevent touchmove event of the viewport
            this.is_iPad && $('body').attr('ontouchmove', "(function preventTouchMove(e){e.preventDefault();}(event));");
            return this;
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
                trans_end_event = uijet.support.transitionend,
                is_direction_in, has_class_name, _h;

            direction = direction || 'in';
            is_direction_in = direction == 'in';

            if ( uijet.back_navigation ) {
                uijet.back_navigation = false;
                $el.addClass('reverse');
            }
            // bind just one event listener to the end of the animation
            trans_end_event && $el.one(trans_end_event, transitionendHandler);
            // Handle height property animation specially since it's broken in browsers
            if ( 'fold' == transit_type ) {
                if ( is_direction_in ) {
                    _h = widget._total_height || 0;
                    if ( ! _h ) {
                        // calculate total height
                        $el.children().each(function () {
                            _h += this.offsetHeight;
                        });
                    }
                    // unfold
                    this.animate($el, 'height', _h + 'px');
                } else {
                    // fold
                    this.animate($el, 'height', 0);
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
                    this['animation_id_' + widget.id] = requestAnimFrame(function () {
                        $el.addClass('transitioned').toggleClass(class_name, is_direction_in);
                    });
                }
            }
            return this;
        },
        animate             : function ($el, prop, value, callback) {
            var trans_end_event = uijet.support.transitionend,
                have_callback = isFunc(callback),
                request_id;
            $el.addClass('transitioned');
            have_callback && trans_end_event && $el.one(trans_end_event, callback);
            request_id = requestAnimFrame(function () {
                $el[0].style[prop] = value;
            });
            if ( ! trans_end_event ) {
                request_id = have_callback && requestAnimFrame(callback);
            }
            return request_id;
        },
        // ## uijet.switchView
        // @sign: switchView(view)  
        // @return: uijet
        //
        // Takes a view widget and switches the current view with it.  
        // Most important, this method calls the `sleep` method of the current view.
        switchView          : function (view) {
            var _current = this.current_view;
            if ( _current !== view ) {
                _current && _current.sleep();
                this.current_view = view;
                this.publish('view_switched');
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
        switchCurrent       : function (widget) {
            var container_id = widgets[widget.id].container,
                siblings = container_id ? widgets[container_id].contained || [] : [], sibling,
                _parent = (widget.$wrapper || widget.$element)[0].parentNode,
                $top;
            if ( ! container_id && ~ widget.options.type_class.indexOf('uijet_view') ) {
                this.switchView(widget);
            }
            else {
                for ( var l = 0; sibling = siblings[l]; l++ ) {
                    sibling = widgets[sibling].self;
                    if ( sibling.layered && sibling !== widget && sibling.awake ) {
                        $top = (sibling.$wrapper || sibling.$element);
                        if ( $top[0].parentNode === _parent ) {
                            if ( sibling.options.keep_layer_awake ) {
                                sibling.options.state = 'awake';
                                $top.removeClass('current');
                            } else {
                                sibling.sleep();
                            }
                        }
                    }
                }
            }
            widget.options.state = 'current';
            (widget.$wrapper || widget.$element).addClass('current');
            return this;
        },
        // ## uijet.buildContext
        // @sign: buildContext(route, args_array)  
        // @return: context
        //
        // Builds a context `Object` from the returned arguments of a route.  
        // Named parameters in `route` are indexed in the context obejct by their name.  
        // Unnamed parameters are indexed by their index in `args_array`.
        buildContext        : function (route, args_array) {
            var context = {},
                parts = route.split('/'),
                i = 0, n = 0, part;
            args_array = toArray(args_array);
            while ( part = parts[i++], typeof part == 'string' ) {
                // if it's a named argument
                if ( part[0] === ':' ) {
                    // then add it to the conetxt by name
                    context[part.slice(1)] = args_array.shift();
                    n += 1;
                } else if ( ~ part.indexOf('(') ) {
                    // if it's unnamed then add it by its index in `args_array`
                    context[n] = args_array.shift();
                    n += 1;
                }
            }
            return context;
        }
    };
    // set a namespace on uijet for utility functions.
    uijet.Utils = {
        extend          : extend,
        extendProto     : extendProto,
        Create          : Create,
        isObj           : isObj,
        isArr           : isArr,
        isFunc          : isFunc,
        toArray         : toArray,
        returnOf        : returnOf,
        getStyle        : getStyle,
        getStyleProperty: getStyleProperty,
        getOffsetOf     : getOffsetOf,
        // wrap these objects since they point to native objects which is forbidden  
        // You Maniacs! You blew it up! Ah, damn you!
        requestAnimFrame: function (f) { return requestAnimFrame(f); },
        cancelAnimFrame : function (id) { return cancelAnimFrame(id); }
    };
    uijet.Base = Base;
    // return the module
    return uijet;
}));