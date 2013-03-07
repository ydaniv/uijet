/**!
 * UIjet UI Framework
 * @version: 0.0.4
 * @license BSD License (c) copyright Yehonatan Daniv
 * https://raw.github.com/ydaniv/uijet/master/LICENSE
 */
;(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(function () {
            return factory(root);
        });
    } else {
        root.uijet = factory(root);
    }
}(this, function (_window) {
    /*
     * UIjet's globals and some local caching of stuff from global namespace
     */
    var Function = _window.Function,
        Object = _window.Object,
        Array = _window.Array,
        BROWSER_PREFIX = { style : ['webkit', 'Moz', 'O', 'ms'], prop : ['WebKit', 'webkit', 'moz', 'o', 'ms'], matches: {} },
        OPPOSITES = {top:'bottom',bottom:'top',right:'left',left:'right'},
        // native utilities caching
        objToString = Object.prototype.toString,
        arraySlice = Array.prototype.slice,
        // sandbox's registries
        mixins = {},
        adapters = {},
        declared_widgets = [],
        widgets = { __app__: { contained : []} },
        views = {},
        resources = {},
        // caching pre-built predefined widgets' classes
        // `{ proto : widget_prototype, deps : dependencies }`
        widget_definitions = {},
        // caching built pre-defined widgets' classes
        widget_classes = {},
        // caching built and mixed-in widgets' classes
        widget_mixedin_classes = {},
        // caching widgets declarations factories
        widget_factories = {},
        // constants
        TOP_ADAPTER_NAME = 'TopAdapter',
        /**
         * Searches for a prefixed name of `name` inside `obj`.
         * 
         * @param name {String} name to search for
         * @param obj {Object} the source object search in
         * @return prefixed {String|null}
         */
        getPrefixed = function (name, obj) {
            var cases = BROWSER_PREFIX.prop,
                len = cases.length, prop;
            while ( len-- ) {
                if ( prop = obj[cases[len] + name] ) {
                    return prop;
                }
            }
            return null;
        },
        /**
         * Polyfill for requestAnimationFrame
         */
        requestAnimFrame = (function () {
            return _window.requestAnimationFrame ||
                getPrefixed('RequestAnimationFrame', _window) ||
                function( callback ){
                    return _window.setTimeout(callback, 1000 / 60);
                };
        }()),
        /**
         * Polyfill for cancelAnimationFrame
         */
        cancelAnimFrame = (function () {
            return _window.cancelAnimationFrame                      ||
                getPrefixed('CancelRequestAnimationFrame', _window)  ||
                getPrefixed('CancelAnimationFrame', _window)         ||
                function( requestId ){
                    return _window.clearTimeout(requestId);
                };
        }()),
        // check for touch support
        has_touch = !!(('ontouchstart' in _window) || _window.DocumentTouch && document instanceof DocumentTouch),
        /**
         * Checks if given argument is an `Array`.
         * Uses @see Array.isArray by default if it exists.
         * 
         * @namespace Utils
         * @param obj {*} target object to check
         * @return is_array {Boolean} whether `obj` is an `Array`
         */
        isArr = (function () {
            return Array.isArray || function (obj) {
                return objToString.call(obj) == '[object Array]';
            };
        }()),
        // the sandbox
        uijet;

    // a simple shim of Function.bind to support Safari 5- (mostly old iOS) and Android <4
    if ( typeof Function.bind != 'function' ) {
        Function.prototype.bind = function (scope) {
            var _self = this,
                args = arraySlice.call(arguments, 1);
            return function () {
                return _self.apply(scope, args.concat(arraySlice.call(arguments)));
            };
        };
    }
    /**
     * Checks if given argument is an `Object`.
     *
     * @namespace Utils
     * @param obj {*} target object to check
     * @return {Boolean} whether `obj` is an `Object`
     */
    function isObj (obj) {
        return objToString.call(obj) == '[object Object]';
    }
    /**
     * Checks if argument `obj` is an `Function`.
     *
     * @namespace Utils
     * @param obj {*} target object to check
     * @return {Boolean} whether `obj` is an `Function`
     */
    function isFunc (obj) {
        return typeof obj == 'function';
    }
    /**
     * Checks if given argument is an `Arguments` object.
     *
     * @namespace Utils
     * @param obj {*} target object to check
     * @return {Boolean} whether `obj` is an `Arguments` object
     */
    function isArgs (obj) {
        return objToString.call(obj) == '[object Arguments]';
    }
    /**
     * Utility for either wrapping an argument with an `Array` or return a copy of that array.
     * If an array-like object is given then converts it into a plain `Array`.
     * If the argument supplied is `undefined` or no arguments are supplied then returns `undefined`.
     *
     * @namespace Utils
     * @param obj {*} target object to check
     * @return copy {Array|undefined}
     */
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
    /**
     * Gets the computed style object (`CSSStyleDeclaration`) of an `HTMLElement` `el`.
     * If `prop` is supplied they return it's value.
     * If a list of properties `prop` is supplied then return a corresponding list of values.
     * An optional pseudo-element argument can be used to fetch its style.
     * If the element is a decendent of a window object that isn't this global namespace
     * you can supply that window object as fourth argument.
     *
     * @namespace Utils
     * @param el {HTMLElement} the element to use
     * @param [prop] {String|Array} the property to fetch or list of properties
     * @param [pseudo] {String} a name of a pseudo-element of that element to get its style
     * @param [win] {HTMLWindowElement} The window element that element `el` belongs to
     * @return style {String|Array|CSSStyleDeclaration} the read-only style object of that element or the value[s] of that property[ies]
     */
    function getStyle (el, prop, pseudo, win) {
        var style = (win || _window).getComputedStyle(el, pseudo || null), res, p;
        if ( prop ) {
            if ( isArr(prop) ) {
                res = {};
                for ( var i = 0 ; p = prop[i++] ; ) {
                    res[p] = style.getPropertyValue(p);
                }
                return res;
            }
            return style.getPropertyValue(prop);
        }
        return style;
    }
    /**
     * Checks if given argument is `Function`, and either calls it with
     * optional second argument as its context or simply returns it if it's not callable.
     * 
     * @namespace Utils
     * @param arg {*} argument to check if callable and return its call or itself if not
     * @param [ctx] {Object} context object to use for the call
     * @returns {*} the argument or its `.call()`'s product.
     */
    // Wrapper for checking if a variable is a function and return its returned value or else simply return it.
    function returnOf (arg, ctx) {
        return isFunc(arg) ? arg.apply(ctx || _window, arraySlice.call(arguments, 2)) : arg;
    }

    /**
     * Rethrows an `Error` object or throws a new one if the given argument is not an `Error`.
     * 
     * @namespace Utils
     * @param [err] {Error|String}
     */
    function rethrow (err) {
        if ( err && err.stack && err.message ) throw err;
        else throw new Error(err);
    }

    /**
     * Shallow (or deep) copy `Object`s (`Array`s are shallow copied).
     * If first argument is `true` then does a deep copy.
     * First (or second if first is a `Boolean`) argument is the target object to copy to,
     * all subsequent arguments are source objects to copy from.
     * Objects are copied to target from left to right.
     * 
     * @namespace Utils
     * @params target {Object|Boolean} the target object or `true` for deep copying
     * @params [source...] {Object} the target object if deep copying or a source object(s)
     * @returns target {Object} the target object
     */
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

    /**
     * Deep copy (prototype) objects (Arrays are shallow copied), @see extend.
     * If a property of same name exists in both source and target then if that property is:
     * 
     * * Object: deep copy.
     * * Function: target method is wrapped to support a super call to the source method.
     * * otherwise: shallow copy 
     * 
     * First argument is the target object to copy to,
     * All subsequent arguments are source objects to copy from.
     * Objects are copied to target from left to right.
     * 
     * @namespace Utils
     * @params target {Object} the target object
     * @params [source...] {Object} the source object(s)
     * @returns target {Object} the target object
     */
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

    /**
     * Shallow copy properties while making sure functions are bound to `context`, @see extend.
     * Usually used in `uijet.use()`.
     * 
     * @namespace Utils
     * @param target {Object} target object to extend
     * @param source {Object} source object to copy from
     * @param [context] {Object} optional context object to bind `Function` properties to
     * @returns target {Object} the target object
     */
    function extendProxy (target, source, context) {
        var s;
        // loop over source's properties
        for ( s in source ) {
            // if it's a `Function`
            if ( isFunc(source[s]) ) {
                // bind and copy it to target
                target[s] = context ? source[s].bind(context) : source[s];
            } else {
                // otherwise just copy
                target[s] = source[s];
                // if it's an `Object`
                if ( isObj(source[s]) ) {
                    // from this point the context is available, no need to bind
                    extendProxy(target[s], source[s]);
                }
            }
        }
        return target;
    }

    /**
     * Copies `Function` own properties of one object to another,
     * mainly for copying static methods between constructors.
     * 
     * @param source {Function} source constructor to take methods from
     * @param target {Function} target constructor for copying the methods to 
     * @returns target {Function} the target constructor
     */
    function copyStaticMethods (source, target) {
        for ( var m in source )
            if ( source.hasOwnProperty(m) && isFunc(source[m]) )
                target[m] = source[m];
        return target;
    }

    /**
     * Base class for components.
     * Defines events and signals API and some OO extensions.
     * 
     * @class
     * @constructor Base
     */
    function Base () {
        this.signals_cache = {};
        this.signals = Object.create(this.signals_cache);
    }

    /**
     * Extends this class' prototype with another object's properties.
     * 
     * @param props {Object} properties to deep copy to the `prototype`
     * @returns prototype {Object} the prototype of this class
     */
    Base.extend = function (props) {
        return extend(true, this.prototype, props);
    };
    /**
     * Creates a new class that is composed of the given class or Object and inherits this class.
     *
     * @param child {Object|Function} the child class or Object that will be copied and used to inherit this class
     * @returns derivative {Function} constructor of the new created class
     */
    Base.derive = function derive (child) {
        return copyStaticMethods(this, Create(child, this, true));
    };
    /**
     * Creates a new class that is composed of this class and will inherit the given class or Object.
     *
     * @param parent {Object} the parent class or Object that will be copied and used as the parent of this class
     * @returns inherited {Function} constructor of the new created class
     */
    Base.inherit = function inherit (parent) {
        return copyStaticMethods(this, Create(this, parent, true));
    };

    /**
     * Public, inheritable methods of @see Base class.
     * 
     * @memberOf Base
     */
    Base.prototype = {
        constructor : Base,
        /**
         * Registers a handler for the given type.
         * 
         * @param topic {String} the signal's type to register
         * @param handler {Function} the signal's handler to register
         * @returns this {Object}
         */
        listen          : function (topic, handler) {
            this.signals_cache[topic] = handler;
            return this;
        },
        /**
         * Removes a handler of the given type.
         *
         * @param topic {String} the signal's type to remove
         * @returns this {Object}
         */
        unlisten        : function (topic) {
            if ( this.signals_cache[topic] ) {
                delete this.signals[topic];
                delete this.signals_cache[topic];
            }
            return this;
        },
        /**
         * Triggers a signal of the given type and returns the result of its call.
         * If no handler was registered for that signal returns `undefined`.
         * If the first argument is a `Boolean` it is used to determine whether to make sure this
         * signal is triggered *once* during current lifecycle stage.
         * Base does not define a `_finally` method that is used to clean up these "once" states. 
         * 
         * @param topic {String|Boolean}
         * @returns result {*} returned result of the triggered handler or `undefined`
         */
        notify          : function (topic) {
            var handler, own_args_len = 1, args, once = false;
            // if first argument is a boolean it means it's a directive to whether this signal is triggered once
            if ( typeof topic == 'boolean' && topic ) {
                once = true;
                handler = this.signals[arguments[1]];
                own_args_len += 1;
            } else {
                handler = this.signals[topic];
            }
            if ( handler ) {
                args = arraySlice.call(arguments, own_args_len);
                // if `once` is `true` then mask this signal's handler with `null`
                once && (this.signals[topic] = null);
                return handler.apply(this, args);
            }
        },
        /**
         * Registers the given handler under the given type `topic`.
         * If `handler` is a `Function` it is bound to this instance as its context.
         * If `handler` is a `String` it is used to find a method of same name to use as handler.
         * If no method was found then a signal with same type's handler is used.
         * If `handler` is a `String` and starts with a '+' then the `arguments` supplied to this handler will be passed to that method/signal handler.
         * 
         * @param topic {String} the type of the handler to register
         * @param handler {Function|String} the handler to register or a name of a method of this instance or a signal's handler to use as handler
         * @returns this {Object}
         */
        //TODO: change the implementation to support an array of handlers per topic so this won't simply replace existing handlers
        subscribe       : function (topic, handler) {
            var that = this,
                apply_args = false,
                _h;
            if ( typeof handler == 'string' ) {
                if ( handler[handler.length - 1] == '+' ) {
                    apply_args = true;
                    handler = handler.slice(0, -1);
                }
                if ( isFunc(this[handler]) ) {
                    _h = function () {
                        that[handler].apply(that, apply_args ? arguments : []);
                    };
                }
                else if ( isFunc(this.signals_cache[handler]) ) {
                    _h = function () {
                        var args = toArray(arguments);
                        args.unshift(handler);
                        that.notify.apply(that, apply_args ? args : [handler]);
                    };
                }
            }
            else {
                _h = handler.bind(this);
            }
            // add this handler to `app_events` to allow quick unsubscribing later
            this.app_events[topic] = _h;
            uijet.subscribe(topic, _h, this);
            return this;
        },
        /**
         * Removes a handler from the registered events.
         * If `handler` is not supplied then the handler that is currently registered for the given `topic` is used.
         * 
         * @param topic {String} the event type to remove from registry
         * @param [handler] {Function} the handler to remove from the registry
         * @returns this {Object}
         */
        unsubscribe     : function (topic, handler) {
            if ( ! handler && this.app_events ) {
                handler = this.app_events[topic];
            }
            uijet.unsubscribe(topic, handler, this);
            return this;
        },
        /**
         * Triggers an event of given type `topic`.
         * If `data` is supplied it is handed over to the handler as an argument.
         * `topic` is always prefixed with `this.id + '.'`.
         * 
         * @param topic {String} the type of the event to trigger
         * @param [data] {*} argument to pass to the event's handler as data
         * @returns {*}
         */
        publish         : function (topic, data) {
            uijet.publish(this.id + '.' + topic, data);
            return this;
        }
    };

    //TODO: add docs
    function normalizeDeps (deps) {
        if ( ! deps ) return;
        var deps_as_obj = isObj(deps),
            _deps = {};
        // if `deps` is an `Object`
        if ( deps_as_obj ) {
            // convert the dependecies inside it to `Array`s
            _deps.mixins = toArray(deps.mixins);
            _deps.widgets = toArray(deps.widgets);
        } else {
            // otherwise, it's just a list of mixins name, just copy it
            _deps.mixins = toArray(deps);
        }
        return _deps;
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
    function Create (proto, _extends, as_constructor) {
        var is_proto_f = isFunc(proto),
            is_extends_f = isFunc(_extends),
            _proto = is_proto_f ? proto.prototype : proto;
        function F () {
            is_extends_f && _extends.call(this);
            is_proto_f && proto.call(this);
        }
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
        return as_constructor ? F : new F();
    }

    /**
     * Returns the specific name of a style property in the current user-agent, meaning, with the proper vendor
     * prefix if needed and found.
     * If there's no match, prefixed or not, returns `null`.
     * Can also be used to check for the support of that CSS feature in current user-agent.
     * 
     * @param prop {String} an un-prefixed name of a style property
     * @returns prefixed {String|null} the matching name of this property for the current user-agent
     */
    function getStyleProperty (prop) {
        var style = _window.document.body.style,
            cases = BROWSER_PREFIX.style,
            prefix, camelized, i = 0;
        // return un-prefixed if found
        if ( prop in style) return prop;
        if ( prop in BROWSER_PREFIX.matches ) {
            // return the cached property name
            return BROWSER_PREFIX.matches[prop];
        }
        else {
            // executed once per property
            camelized = prop[0].toUpperCase() + prop.slice(1);
            if ( prefix = BROWSER_PREFIX.prefix ) {
                if ( (prefix +  camelized) in style ) {
                    BROWSER_PREFIX.matches[prop] = prefix +  camelized;
                    return prefix +  camelized;
                }
            }
            else {
                // executed once until a match is found
                while ( prefix = cases[i++] ) {
                    if ( (prefix +  camelized) in style ) {
                        BROWSER_PREFIX.prefix = prefix;
                        BROWSER_PREFIX.matches[prop] = prefix +  camelized;
                        return prefix +  camelized;
                    }
                }
            }
        }
        return null;
    }
    /**
     * Checks if the first element contains the second element.
     * 
     * __Note__: `Node.compareDocumentPosition()` is not supported on IE8
     * 
     * @param a {HTMLElement} container element
     * @param b {HTMLElement} contained element
     * @returns contained {boolean} whether container contains contained
     */
    function contains (a, b) {
        return b && !!( a.compareDocumentPosition( b ) & 16 );
    }
    /**
     * Gets the offset of `child` relative to `parent`.
     * 
     * __note__: if `child` is not child of `parent` then the returned result will show only `0`s.
     * 
     * @param child {HTMLElement} child element to get its offset
     * @param parent {HTMLElement} parent element to use as relative offset parent
     * @returns offset {Object} an object with `x` and `y` keys and `Number`s as values representing offset in pixels.
     */
    function getOffsetOf (child, parent) {
        var result = { x: 0, y: 0 };
        if ( ! child || ! parent || child === parent || ! contains(parent, child) ) return result;
        do {
            if ( child === parent ) break;
            result.x += child.offsetLeft;
            result.y += child.offsetTop;
        } while ( child = child.offsetParent );
        return result;
    }

    /**
     * The sandbox module.
     * 
     * @namespace uijet
     */
    uijet =  {
        version             : '0.0.4',
        ROUTE_PREFIX        : '',
        ROUTE_SUFFIX        : '',
        init_queue          : [],
        // detected browser features
        support             : {
            touch           : has_touch,
            click_events    : has_touch ?
                //TODO: replace with Zepto's gestures
                { full: 'touchstart', start: 'touchstart', move: 'touchmove', end: 'touchend' } :
                { full: 'click', start: 'mousedown', move: 'mousemove', end: 'mouseup' },
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
        /**
         * Adds functionality to a host object by copying the properties of `props` to the `host` object
         * or `uijet` by default.
         * If `context` is supplied then uses it to bind all the properties of `props` to it.
         * 
         * @param props {Object} the properties to mix-in to the host
         * @param [host] {Object} host object to add these properties to, can be skipped by passing `null`
         * @param [context] {Object} a context object to bind the mixed-in properties to
         * @returns this {Object}
         */
        use                 : function (props, host, context) {
            // get the host object or use `uijet`
            var _host = host || this, m;
            // if `context` is an `Object`
            if ( isObj(context) ) {
                // extend `host` with all methods bound to `context`
                extendProxy(host, props, context);
            }
            // otherwise
            else {
                // simply extend `host` with `props`
                extend(true, _host, props);
            }
            return this;
        },
        /**
         * Defines a new widget class.
         * This class can later be instantiated in the UI or re-used as a dependency. 
         * 
         * @param type {String} this widget's type
         * @param props {Object} properties defined by this widget
         * @param [deps] {String|Array|Object} dependencies for this widget
         * @returns this {Object}
         */
        Widget              : function (type, props, deps) {
            var _deps = normalizeDeps(deps);
            // Cache the widget's definition for JIT creation
            this._define(type, props, _deps);
            // create and cache the class
            widget_classes[type] = _deps ?
                this._generate(props, _deps.mixins, _deps.widgets) :
                this._generate(props);
            return this;
        },
        /**
         * Gets a mixin by name or defines a new mixin for widgets.
         * 
         * @param name {String} name of the mixin to get/define
         * @param [props] {Object} properties defined by this mixin
         * @returns this|mixin {Object}
         */
        Mixin               : function (name, props) {
            if ( arguments.length === 1 ) {
                if ( name in mixins )
                    return mixins[name];
            }
            mixins[name] = props;
            return this;
        },
        /**
         * Gets an adapter by name or defines a new adapter for widgets.
         * If `props` is omitted and `name` is a:
         * 
         * * String: Gets an adapter by this name
         * * Object: Defines a new adapter that will be added at the top of every widget and overrides everything else
         * 
         * @param name {String|Object} a name of an existing or a new adapter or properties for a `TopAdapter` definition
         * @param [props] {Object} properties of the new adapter
         * @returns this|adapter {Object}
         */
        Adapter             : function (name, props) {
            if ( arguments.length === 1 ) {
                if ( typeof name == 'string' && name in adapters ) {
                    return adapters[name];
                }
                else if ( isObj(name) ) {
                    props = name;
                    name = TOP_ADAPTER_NAME;
                }
            }
            adapters[name] = props;
            return this;
        },
        /**
         * Defines a lazy factory of a widget declaration.
         * This declaration can be re-used to prevent repetition of common properties.
         * 
         * __note__: the config of this declaration is copied to every generated instance so make sure you don't leak references.
         * 
         * @param name {String} identifier for this widget factory
         * @param declaration {Object} a viable object for `uijet.declare()`
         * @returns this {Object}
         */
        Factory             : function (name, declaration) {
            widget_factories[name] = function (config) {
                config && extend(true, declaration.config, config);
                return declaration;
            };
            return this;
        },
        /**
         * Gets a resource by name or defines a new resource class.
         * 
         * @param name {String} identifier for that resource class
         * @param [resource] {Object} this resource's prototype
         * @returns this|resource {Object}
         */
        Resource            : function (name, resource) {
            if ( arguments.length === 1 ) {
                if ( name in resources ) {
                    return resources[name];
                }
            }
            resources[name] = resource;
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
                    k, dfrd, q;
                this.options = _options || {};
                // set top container
                this.$element = this.$(_options && _options.element || 'body');
                this.$element.addClass('uijet_app');

                //TODO: this should be either removed or extended for all modern devices
                // sniff for iPad UA and perform optimizations accordingly
                this.isiPad();
                // unless requested by the user
                if ( ! (options && options.dont_cover) ) {
                    // make the app contaier cover the entire viewport
                    this.$element.addClass('cover');
                }
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

                    if ( q = this.init_queue.length ) {
                        while ( q-- ) {
                            dfrd = this.init_queue[q];
                            if ( isFunc(dfrd) ) {
                                this.init_queue[q] = dfrd.call(this);
                            }
                        }
                    }
                    else {
                        this.init_queue = [{}];
                    }

                    this.when( this.init_queue )
                        .then(function () {
                            // build and init declared widgets
                            that.start(declared_widgets, true); 
    
                            //when all declared widgets are initialized, set `uijet.initialized` to `true`
                            that.initialized = true;
                            // kick-start the GUI - unless ordered not to
                            _options.dont_start || that.startup();
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
                this.declare(options.widgets);
            }
            // import all the modules we need (Mixins, Widgets, Adapters, 3rd party...)  
            // and initialization will start when done
            return this.importModules(declared_widgets, _init.bind(this, options));
        },
        // ### uijet._define
        // @sign: _define(name, props, [deps])  
        // @return: uijet
        //
        // Caches a definition of a widget inside uijet,
        // using `name` as the key and `props` as the definition.  
        // Optional `deps` argument can be supplied for defining this widget on top of mixins and/or other widgets.
        _define             : function (_name, _props, _deps) {
            widget_definitions[_name] = {
                proto   : Create(_props, true),
                deps    : _deps
            };
            return this;
        },
        // ### uijet._generate
        // @sign: _generate(_props, [_mixins], [_widgets])  
        // @return: widget_class
        //
        // Generate a widget class using `Create` with `uijet.BaseWidget` as the base prototype.
        _generate           : function (_props, _mixins, _widgets) {
            // create the base class
            var _class = this.BaseWidget,
                _mixins_copy = toArray(_mixins),
                _mixins_to_use = [],
                _mixin, _widget, _widgets_copy;
            // if we have widgets to build on then mix'em
            if ( _widgets && _widgets.length ) {
                // copy widgets dependencies
                _widgets_copy = toArray(_widgets);
                // loop over them
                while ( _widget = _widgets_copy.shift() ) {
                    // if they're defined
                    if ( widget_definitions[_widget] ) {
                        // add them to the chain
                        // just like stacking turtles
                        _class = Create(widget_definitions[_widget].proto, _class, true);
                        // check if they have dependencies
                        if ( widget_definitions[_widget].deps && widget_definitions[_widget].deps.mixins ) {
                            _mixins_to_use = toArray(widget_definitions[_widget].deps.mixins);
                        }
                    }
                }
            }
            // now we add this widget to the stack
            _class = Create(_props, _class, true);
            // if we have mixins to mix then mix'em
            if ( _mixins_copy ) {
                // if a widget in dependencies had mixins in its dependencies
                if ( _mixins_to_use.length ) {
                    for ( var m = _mixins_to_use.length; _mixin = _mixins_to_use[--m]; ) {
                        // add every mixin form the parents' mixins that's not in the list to its beginning
                        if ( !~ _mixins_copy.indexOf(_mixin) ) {
                            _mixins_copy.unshift(_mixin);
                        }
                    }
                }
                // copy mixins dependencies
                _mixins_to_use = _mixins_copy;
            }
            while ( _mixin = _mixins_to_use.shift() ) {
                // if they're defined
                if ( mixins[_mixin] ) {
                    // add them to the chain
                    // stack those madafakas
                    _class = Create(mixins[_mixin], _class, true);
                }
            }
            return _class;
        },
        // ## uijet._start
        // @sign: _start(widget)  
        // @return: deferred_start OR uijet
        //
        // Performs the work for the `uijet.start` API call.
        _start              : function (_widget, _skip_import) {
            var that = this,
                _factory = _widget.factory, _type, _config,
                _dfrd_start, _self, mixedin_type, _w, l, _d, _c, _mixins, _adapters, _widgets;
            if ( _factory && widget_factories[_factory] ) {
                _widget = widget_factories[_factory](_config);
            }
            _type = _widget.type;
            _config = _widget.config;
            // if not `true` then import dependencies first and then do the starting
            if ( ! _skip_import ) {
                _dfrd_start = this.Promise();
                // the import's callback
                _self = function () {
                    that._start(_widget, true);
                    _dfrd_start.resolve();
                    return this;
                };
                // do import
                this.importModules([_widget], _self);
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
                        _c = this._generate(_d.proto, _mixins, _widgets);
                        // and cache it
                        widget_mixedin_classes[mixedin_type] = _c;
                    }
                } else {
                    // just get the stored widget class definition
                    _c = widget_classes[_type];
                }
                // create a new widget instance from that class
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
        // ### uijet.register
        // @sign: register(widget)  
        // @return: uijet
        //
        // Registers a widget into uijet's widgets tree.
        register            : function (widget) {
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
            if ( ! _current.container ) {
                widgets.__app__.contained.push(_id);
                _current.container = '__app__';
            }
            return this;
        },
        // ## uijet.unregister
        // @sign: unregister(widget)  
        // @return: uijet
        //
        // Unregisters a widget from uijet's widgets tree.
        unregister          : function (widget) {
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
        // ## uijet.declare
        // @sign: declare(widgets)  
        // @return: uijet
        //
        // Declare one or more widgets that will be started once the app is initialized.  
        // `widgets` can be either an `Object` containing a widget's declaration (_type_ and _config_)
        // or an `Array` of such objects.
        declare             : function (_widgets) {
            if ( isObj(_widgets) ) {
                declared_widgets.push(_widgets);
            } else if ( isArr(_widgets) ) {
                declared_widgets = declared_widgets.concat(_widgets);
            }
            return this;
        },
        // ## uijet.start
        // @sign: start(widget)  
        // @return: promise OR uijet
        //
        // Constructs and initializes an instance of a widget using a cached definition.  
        // If defined AMD style it will load all dependencies first.  
        // This instance will be initialized and registered into uijet at the end.  
        // `widget` is an `Objcet` representing a widget's declaration, which contains the following key:  
        // 
        // * `type`: a string representing the widget's type.  
        // * `config`: additional options to add to that instance:
        //TODO: continue the list below
        //      * __mixins__: a `String` name of a mixin or an `Array` of names of mixins to add to this instance build.
        //      * __adapters__: a list of names of mixins to add to this instance.
        //
        // @sign: start(widgets)  
        // @return: promise
        //
        // Accepts an `Array` of widgets definitions and starts them one by one.  
        // Returns a promise that's resolved after all the `widgets` started successfully or
        // rejects this promise if there's an error.
        start               : function (_widgets, _skip_import) {
            var i, dfrd_starts, _c;
            // if `_widgets` is an `Object`
            if ( isObj(_widgets) ) {
                // do the starting
                return this._start(_widgets, _skip_import);
            }
            // if it's an `Array`
            else if ( isArr(_widgets) ) {
                i = 0;
                dfrd_starts = [];
                // loop over the widget declarations in it
                while ( _c = _widgets[i] ) {
                    // and start every one of them
                    dfrd_starts[i] = this._start(_c, _skip_import);
                    i+=1;
                }
                // return a promise of all `_widgets` started
                return this.when(dfrd_starts);
            }
            throw new Error('`widgets` must be either an Object or an Array. Instead got: ' + objToString.call(_widgets));
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
                    if ( _w.type ) {
                        // build widget's path
                        _m_type = widgets_prefix + _w.type;
                        // if this widget type wasn't loaded and isn't in the dependencies list then add it
                        (widget_classes[_w.type] || ~ deps.indexOf(_m_type)) || deps.push(_m_type);
                    }
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
            uijet.$element.on(uijet.support.click_events.full, function () {
                uijet.publish('app.clicked');
            });
            this.$element[0].style.visibility = 'visible';
            this.publish('startup');
            return this;
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
        //TODO: add docs
        position            : function (widget, exclude) {debugger;
            var container_id = widgets[widget.id].container,
                siblings = container_id ? widgets[container_id].contained || [] : [], sibling,
                position = {position: 'absolute', top: 0, bottom: 0, right: 0, left: 0},
                set_style = false,
                processed_position, p, len;
            if ( exclude && (len = exclude.length) ) {
                while ( len-- ) {
                    delete position[exclude[len]];
                    delete position[OPPOSITES[exclude[len]]];
                }
                delete position.position;
            }
            else {
                exclude = '';
            }
            for ( len = siblings.length; len--; ) {
                sibling = siblings[len];
                if ( sibling == widget.id ) continue;
                if ( processed_position = widgets[sibling].self.processed_position ) {
                    set_style = true;
                    for ( p in processed_position ) {
                        !~ exclude.indexOf(p) && (position[p] = processed_position[p]);
                    }
                }
            }
            if ( set_style ) {
                if ( 'left' in position || 'right' in position ) position.width = 'auto';
                if ( 'top' in position || 'bottom' in position ) position.height = 'auto';
                widget.style(position);
            }
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
        // For example, if you need to set a route of a Form's submit with the submit method.
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
            this.is_iPad && this.$('body').attr('ontouchmove', "(function preventTouchMove(e){e.preventDefault();}(event));");
            return this;
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
        // ## uijet.switchLayer
        // @sign: switchLayer(widget)  
        // @return: uijet
        //
        // Takes a widget and makes sure all its siblings, who share the same direct parent DOM Node, awake
        // and are set to `current` state, do not have the `current` class set on their top element and their
        // state is switched to `awake`.  
        // At the end adds the `current` class to the widget's top element.
        switchLayer         : function (widget) {
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
                    // then add it to the context by name
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
        extendProxy     : extendProxy,
        Create          : Create,
        isObj           : isObj,
        isArr           : isArr,
        isFunc          : isFunc,
        toArray         : toArray,
        returnOf        : returnOf,
        rethrow         : rethrow,
        getStyle        : getStyle,
        getStyleProperty: getStyleProperty,
        getOffsetOf     : getOffsetOf,
        // wrap these objects since they point to native objects which is forbidden  
        // You Maniacs! You blew it up! Ah, damn you!
        requestAnimFrame: function (f) { return requestAnimFrame(f); },
        cancelAnimFrame : function (id) { return cancelAnimFrame(id); }
    };

    uijet.Base = Base;

    return uijet;
}));