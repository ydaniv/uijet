/*!
 * UIjet UI Framework
 * @version 0.0.30
 * @license BSD License (c) copyright Yehonatan Daniv
 * https://raw.github.com/ydaniv/uijet/master/LICENSE
 */
;(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(function () {
            return factory(root);
        });
    }
    else {
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
        // modules paths
        import_paths = {
            widgets : 'uijet_dir/widgets/',
            adapters: 'uijet_dir/adapters/',
            mixins  : 'uijet_dir/mixins/'
        },
        /**
         * Searches for a prefixed name of `name` inside `obj`.
         *
         * @param {String} name            - name to search for
         * @param {Object} obj             - the source object search in
         * @returns {String|null} prefixed - the prefixed property or `null` if not found
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
         * @param {*} obj              - target object to check
         * @returns {Boolean} is_array - whether `obj` is an `Array`
         */
        isArr = (function () {
            return Array.isArray || function (obj) {
                return objToString.call(obj) == '[object Array]';
            };
        }()),
        // the sandbox
        uijet;

    /** a simple shim of Function.bind to support Safari 5- (mostly old iOS) and Android <4 */
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
     * @param {*} obj               - target object to check
     * @returns {Boolean} is_object - whether `obj` is an `Object`
     */
    function isObj (obj) {
        return objToString.call(obj) == '[object Object]';
    }
    /**
     * Checks if argument `obj` is an `Function`.
     *
     * @param {*} obj                 - target object to check
     * @returns {Boolean} is_function - whether `obj` is an `Function`
     */
    function isFunc (obj) {
        return typeof obj == 'function';
    }
    /**
     * Checks if given argument is an `Arguments` object.
     *
     * @param {*} obj                  - target object to check
     * @returns {Boolean} is_arguments - whether `obj` is an `Arguments` object
     */
    function isArgs (obj) {
        return objToString.call(obj) == '[object Arguments]';
    }
    /**
     * Utility for either wrapping an argument with an `Array` or return a copy of that array.
     * If an array-like object is given then converts it into a plain `Array`.
     * If the argument supplied is `undefined` or no arguments are supplied then returns `undefined`.
     *
     * @param {*} obj                  - target object to check
     * @returns {Array|undefined} copy - an `Array` copy of `obj` or `undefined`
     */
    function toArray (obj) {
        var arr;
        if ( isArgs(obj) || /object .*List/.test(objToString.call(obj)) ) {
            // convert to `Array`
            arr = arraySlice.call(obj);
        }
        else if ( isArr(obj) ) {
            // copy that
            arr = obj.slice(0);
        }
        else if ( typeof obj != 'undefined' ) {
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
     * @param {HTMLElement} el                           - the element to use
     * @param {String|Array} [prop]                      - the property to fetch or list of properties
     * @param {String} [pseudo]                          - a name of a pseudo-element of that element to get its style
     * @param {HTMLWindowElement} [win]                  - The window element that element `el` belongs to
     * @returns {String|Array|CSSStyleDeclaration} style - the read-only style object of that element or the value[s] of that property[ies]
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
     * @param {*} arg        - argument to check if callable and return its call or itself if not
     * @param {Object} [ctx] - context object to use for the call
     * @returns {*} product  - the argument or its `.call()`'s product.
     */
    function returnOf (arg, ctx) {
        return isFunc(arg) ? arg.apply(ctx || _window, arraySlice.call(arguments, 2)) : arg;
    }

    /**
     * TODO: add docs
     * @param obj
     * @returns {*}
     */
    function toElement (obj, context) {
        if ( obj && (typeof obj == 'string' || obj.nodeType === 1) ) {
            obj = uijet.$(obj, context || document);
        }
        return obj;
    }

    /**
     * Rethrows an `Error` object or throws a new one if the given argument is not an `Error`.
     *
     * @param {Error|String} [err] - an error to rethrow or a `String` message to use for throwing a new `Error`.
     * @throws {*}
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
     * @param {Object|Boolean} target - the target object or `true` for deep copying
     * @param {Object} [source...]    - the target object if deep copying or a source object(s)
     * @returns {Object} target       - the target object
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
                    }
                    else {
                        target[s] = source[s];
                    }
                }
            }
            else {
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
     * @param {Object} target      - the target object
     * @param {Object} [source...] - the source object(s)
     * @returns {Object} target    - the target object
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
                }
                else if ( isObj(source[s]) && isObj(target[s]) ) {
                    target[s] = extend(true, {}, target[s], source[s]);
                }
                else {
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
     * @param {Object} target    - target object to extend
     * @param {Object} source    - source object to copy from
     * @param {Object} [context] - optional context object to bind `Function` properties to
     * @returns {Object} target  - the target object
     */
    function extendProxy (target, source, context) {
        var s;
        // loop over source's properties
        for ( s in source ) {
            // if it's a `Function`
            if ( isFunc(source[s]) ) {
                // bind and copy it to target
                target[s] = context ? source[s].bind(context) : source[s];
            }
            else {
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
     * @param {Function} source   - source constructor to take methods from
     * @param {Function} target   - target constructor for copying the methods to
     * @returns {Function} target - the target constructor
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
     * @constructor
     * @class Base
     */
    function Base () {
        this.signals_cache = {};
        this.signals = Object.create(this.signals_cache);
    }

    /**
     * Extends this class' prototype with another object's properties.
     *
     * @static
     * @param {Object} props       - properties to deep copy to the `prototype`
     * @returns {Object} prototype - the prototype of this class
     */
    Base.extend = function (props) {
        return extend(true, this.prototype, props);
    };
    /**
     * Creates a new class that is composed of the given class or Object and inherits this class.
     *
     * @static
     * @param {Object|Function} child - the child class or Object that will be copied and used to inherit this class
     * @returns {Function} derivative - constructor of the new created class
     */
    Base.derive = function derive (child) {
        return copyStaticMethods(this, Create(child, this, true));
    };
    /**
     * Creates a new class that is composed of this class and will inherit the given class or Object.
     *
     * @static
     * @param {Object} parent        - the parent class or Object that will be copied and used as the parent of this class
     * @returns {Function} inherited - constructor of the new created class
     */
    Base.inherit = function inherit (parent) {
        return copyStaticMethods(this, Create(this, parent, true));
    };

    /**
     * Public, inheritable methods of @see Base class.
     */
    Base.prototype = {
        constructor : Base,
        /**
         * Registers a handler for the given type.
         *
         * @param {String} topic     - the signal's type to register
         * @param {Function} handler - the signal's handler to register
         * @returns {Object} this
         */
        listen          : function (topic, handler) {
            this.signals_cache[topic] =  this._parseHandler(handler);
            return this;
        },
        /**
         * Removes a handler of the given type.
         * If no `topic` is given then removes all handlers.
         *
         * @param {String} [topic] - the signal's type to remove
         * @returns {Object} this
         */
        unlisten        : function (topic) {
            if ( ! topic ) {
                for ( topic in this.signals_cache ) {
                    this.unlisten(topic);
                }
            }
            else if ( this.signals_cache[topic] ) {
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
         * @param {Boolean} [once] - optional`true` flag to make sure this signal is notified once per lifecycle stage
         * @param {String} topic   - the name of the signal to notify
         * @param {*} [args...]    - arguments to hand over to the signal's handler
         * @returns {*} result     - returned result of the triggered handler or `undefined`
         */
        notify          : function (topic) {
            var handler, own_args_len = 1, args, once = false;
            // if first argument is a boolean it means it's a directive to whether this signal is triggered once
            if ( typeof topic == 'boolean' && topic ) {
                once = true;
                topic = arguments[1];
                own_args_len += 1;
            }
            if ( handler = this.signals[topic] ) {
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
         * If `handler` is a `String` and ends with a '+' then the `arguments` supplied to this handler will be passed to that method/signal handler.
         *
         * @param {String} topic    - the type of the handler to register
         * @param {Function|String} - handler the handler to register or a name of a method of this instance or a signal's handler to use as handler
         * @returns {Object} this
         */
        //TODO: change the implementation to support an array of handlers per topic so this won't simply replace existing handlers
        subscribe       : function (topic, handler) {
            handler = isFunc(handler) ? handler.bind(this) : this._parseHandler(handler);
            // add this handler to `app_events` to allow quick unsubscribing later
            this.app_events[topic] = handler;
            uijet.subscribe(topic, handler, this);
            return this;
        },
        /**
         * Removes a handler from the registered events.
         * If `handler` is not supplied then the handler that is currently registered for the given `topic` is used.
         *
         * @param {String} topic       - the event type to remove from registry
         * @param {Function} [handler] - the handler to remove from the registry
         * @returns {Object} this
         */
        unsubscribe     : function (topic, handler) {
            if ( ! handler && this.app_events ) {
                handler = this.app_events[topic];
                delete this.app_events[topic];
            }
            uijet.unsubscribe(topic, handler, this);
            return this;
        },
        /**
         * Triggers an event of given type `topic`.
         * If `data` is supplied it is handed over to the handler as an argument.
         * `topic` is always prefixed with `this.id + '.'`.
         *
         * @param {String} topic - the type of the event to trigger
         * @param {*} [data]     - argument to pass to the event's handler as data
         * @returns {Object} this
         */
        publish         : function (topic, data) {
            uijet.publish(this.id + '.' + topic, data);
            return this;
        },
        _parseHandler   : function (handler) {
            var that = this,
                apply_args = false,
                is_global = false,
                _h;
            if ( typeof handler == 'string' ) {
                if ( handler[handler.length - 1] == '+' ) {
                    apply_args = true;
                    handler = handler.slice(0, -1);
                }
                if ( handler[0] == '-' ) {
                    is_global = true;
                    handler = handler.slice(1);
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
                else {
                    _h = function () {
                        var args = toArray(arguments);
                        args.unshift(handler);
                        (is_global ? uijet : that).publish.apply(that, apply_args ? args : [handler]);
                    };
                }
                return _h;
            }
            return handler;
        }
    };
    /**
     * Nomalizes a name of a dependency or an array names of dependencies into a standard dependencies object
     * with `mixins` and `widgets` keys containing `Array`s of names of mixins and widgets.
     *
     * According to the `deps` argument it behaves as follows:
     * * `String` it's assumed to be a name of a mixin.
     * * `Array` it's assumed to be a list of mixin names.
     * * `Object` it's assumed to be a standard dependencies object and its `mixins` and `widgets` keys are normalized to `Array`s.
     * * Falsy arguments yield `undefined`
     *
     * @param {*} deps                  - the dependencies to normalize into an `Object`
     * @returns {Object|undefined} deps - a standard dependencies object
     */
    function normalizeDeps (deps) {
        if ( ! deps ) return;
        var deps_as_obj = isObj(deps),
            _deps = {};
        // if `deps` is an `Object`
        if ( deps_as_obj ) {
            // convert the dependecies inside it to `Array`s
            _deps.mixins = toArray(deps.mixins) || [];
            _deps.widgets = toArray(deps.widgets) || [];
        }
        else {
            // otherwise, it's just a list of mixins name, just copy it
            _deps.mixins = toArray(deps);
            _deps.widgets = [];
        }
        return _deps;
    }

    /**
     * Gets a normalized `object` of dependencies, as returned by @see normalizeDeps,
     * and checks for modules in it that are not yet defined, in `mixins` and `widget_classes`.
     * 
     * If any dependency is missing returns `true`, otherwise `false`.
     * 
     * @param {Object} deps       - normalized dependencies declaration
     * @returns {Boolean} missing - whether there's a dependency that's not defined yet
     */
    function missingDependency (deps) {
        var m, len;
        for ( len = deps.mixins.length; m = deps.mixins[--len]; ) {
            if ( ! (m in mixins) )
                return true;
        }
        for ( len = deps.widgets.length; m = deps.widgets[--len]; ) {
            if ( ! (m in widget_classes) )
                return true;
        }
        return false;
    }

    /**
     * Creates a new class from a given prototype object or a constructor function,
     * optionally inheriting the prototype/constructor `_extends`.
     * Returns an instance of the created class or, optionally, the class itself.
     * 
     * @param {Function|Object} proto      - a constructor or an object to use as the top level prototype
     * @param {Function|Object} [_extends] - a constructor of a class to inherit from or simply an object to add to the prototype chain
     * @param {Boolean} [as_constructor]   - whether to return the new created class' constructor or instance
     * @returns {Function|Object} created  - the new created class constructor or its instance
     */
    function Create (proto, _extends, as_constructor) {
        var is_proto_f = isFunc(proto),
            is_extends_f = isFunc(_extends),
            _proto = is_proto_f ? proto.prototype : proto;
        function F () {
            // call original constructors
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
     * @param {String} prop            - an un-prefixed name of a style property
     * @returns {String|null} prefixed - the matching name of this property for the current user-agent
     */
    function getStyleProperty (prop) {
        var style = _window.document.body.style,
            cases = BROWSER_PREFIX.style,
            prefix, camelized, i = 0;
        // return un-prefixed if found
        if ( prop in style) return prop;
        // check cache
        if ( prop in BROWSER_PREFIX.matches ) {
            // return the cached property name
            return BROWSER_PREFIX.matches[prop];
        }
        else {
            // executed once per property
            camelized = prop[0].toUpperCase() + prop.slice(1);
            // try cached prefix
            if ( prefix = BROWSER_PREFIX.prefix ) {
                if ( (prefix +  camelized) in style ) {
                    // cache result
                    BROWSER_PREFIX.matches[prop] = prefix +  camelized;
                    return prefix +  camelized;
                }
            }
            else {
                // executed once until a match is found
                // try all prefixes
                while ( prefix = cases[i++] ) {
                    if ( (prefix +  camelized) in style ) {
                        // cache the prefix that worked
                        BROWSER_PREFIX.prefix = prefix;
                        // cache the result
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
     * @param {HTMLElement} a       - container element
     * @param {HTMLElement} b       - contained element
     * @returns {boolean} contained - whether container contains contained
     */
    function contains (a, b) {
        return b && (a.contains ?
                a != b && a.contains(b) :
                !!( a.compareDocumentPosition( b ) & 16 ));
    }
    /**
     * Gets the offset of `child` relative to `parent`.
     *
     * __note__: if `child` is not child of `parent` then the returned result will show only `0`s.
     *
     * @param {HTMLElement} child  - child element to get its offset
     * @param {HTMLElement} parent - parent element to use as relative offset parent
     * @returns {Object} offset    - an object with `x` and `y` keys and `Number`s as values representing offset in pixels.
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
        version             : '0.0.30',
        route_prefix        : '',
        route_suffix        : '',
        init_queue          : [],
        /**
         * Detected browser features
         * 
         * @namespace support
         */
        support             : {
            touch           : has_touch,
            /**
             * Detected browser features
             *
             * @namespace click_events
             */
            click_events    : has_touch ?
                // can be replaced with gestures (like 'tap') if handled by other library
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
         * @param {Object} props     - the properties to mix-in to the host
         * @param {Object} [host]    - host object to add these properties to, can be skipped by passing `null`
         * @param {Object} [context] - a context object to bind the mixed-in properties to
         * @returns {Object} this
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
         * @param {String} type                - this widget's type
         * @param {Object} props               - properties defined by this widget
         * @param {String|Array|Object} [deps] - dependencies for this widget
         * @returns {Object} this
         */
        Widget              : function (type, props, deps) {
            var _deps = normalizeDeps(deps);
            // Cache the widget's definition for JIT creation
            this._define(type, props, _deps);
            // create and cache the class
            // if we have dependencies
            if ( _deps && ! this.initialized ) {
                if ( missingDependency(_deps) ) {
                    // defer the widget class definition till we have promises module loaded
                    // plus its dependencies are loaded
                    this.init_queue.push(function (deferred) {
                        // make sure they're all loaded
                        this.importModules(_deps,
                            function () {
                                widget_classes[type] = this._generate(props, _deps.mixins, _deps.widgets);
                                deferred.resolve();
                            }.bind(this)
                        );
                        return deferred.promise();
                    });
                    // setting a placeholder for this widget definition so that uijet
                    // will not get confused and try to load it from elsewhere, e.g. in `_extractDependencies()`
                    widget_classes[type] = true;
                }
                else {
                    widget_classes[type] = this._generate(props, _deps.mixins, _deps.widgets);
                }
            }
            else {
                widget_classes[type] = this._generate(props);
            }
            return this;
        },
        /**
         * Gets a mixin by name or defines a new mixin for widgets.
         *
         * @param {String} name    - name of the mixin to get/define
         * @param {Object} [props] - properties defined by this mixin
         * @returns {Object} this|mixin
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
         * @param {String|Object} name - a name of an existing or a new adapter or properties for a `TopAdapter` definition
         * @param {Object} [props]     - properties of the new adapter
         * @returns {Object} this|adapter
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
         * @param {String} name        - identifier for this widget factory
         * @param {Object} declaration - a viable object for `uijet.declare()`
         * @returns {Object} this
         */
        Factory             : function (name, declaration) {
            widget_factories[name] = function (config) {
                // create a copy of the original declaration
                var copy = { type : declaration.type };
                // make sure the original `config` object is copied
                copy.config = extend({}, declaration.config);
                // mix in additional configurations
                config && extend(true, copy.config, config);
                return copy;
            };
            return this;
        },
        /**
         * Gets a resource instance by name or registers a new resource instance.
         * If `initial` is a `true` it registers `resource` as the resource instance under `name`.
         * Otherwise, calls @see newResource that should be implemented by the module adapter
         * to generate a new resource instance and registers it.
         *
         * Optionally you can send any number of arguments to this method and they will be used as
         * arguments for calling @see newResource, e.g: the second optional `options` argument for
         * instantiating a Backbone.js resource.
         *
         * @param {String} name            - identifier for that resource class
         * @param {Object} [resource]      - this resource's constructor
         * @param {Boolean|Object|Array} [initial] - initial data for the generated instance or `true` to reset the registry of `name` to be instance `resource`
         * @returns {Object} this|resource_instance
         */
        Resource            : function (name, resource, initial) {
            if ( arguments.length === 1 ) {
                if ( name in resources ) {
                    return resources[name];
                }
            }
            if ( initial === true ) {
                resources[name] = resource;
            }
            else {
                resources[name] =  uijet.newResource.apply(uijet, arraySlice.call(arguments, 1));
            }
            return this;
        },
        /**
         * Registers a view in the uijet sandbox.
         * 
         * @param {String} name   - identifier for this view
         * @param {Object} widget - View widget instance to register as a view
         * @returns {Object} this
         */
        View                : function (name, widget) {
            views[name] = widget;
            return this;
        },
        /**
         * Initializes and starts the uijet sandbox and all the declared widgets.
         * This also triggers the import and injection of all required modules 
         * that haven't been loaded yet.
         * 
         * @param {Object} [options] - configuration object for uijet
         * @returns {Object} this
         * 
         * Valid options:
         * 
         * * __element__: {String|HTMLElement} the container element of the application. Defualts to `'body'`.
         * * __dont_cover__: {Boolean} whether to instruct the app's container to stretch across the entire viewport. Defaults to `false`.
         * * __dont_start__: {Boolean} whether to call `uijet.startup()` and kick-start the UI. Defaults to `false`.
         * * __dont_wake__: {Boolean} whether to call `wake()` on all top level widgets. Defaults to `false`.
         * * __pre_startup__: {Function} optional hook for running logic before uijet starts up.
         * * __animation_type__: {String} default type of animation to be used across the app. Defaults to `'slide'` (what else, Rufus?).
         * * __widgets__: {Array} optional list of widget declarations.
         * * __route_prefix__: {String} optional prefix for routes to be used when creating those automatically from widget's IDs.
         * * __route_suffix__: {String} As above, only suffix.
         */
        init                : function (options) {
            // wrap the actuall initialization function
            var _init = function (_options) {
                var _methods = {},
                    that = this,
                    k, task, q;
                this.options = _options || {};
                // set top container
                this.$element = this.$(this.options.element || 'body');
                this.$element.addClass('uijet_app');

                //TODO: this should be either removed or extended for all modern devices
                // sniff for iPad UA and perform optimizations accordingly
                this.isiPad();
                // unless requested by the user
                if ( ! this.options.dont_cover ) {
                    // make the app contaier cover the entire viewport
                    this.$element.addClass('cover');
                }
                if ( _options ) {
                    if ( _options.route_prefix ) {
                        this.route_prefix = _options.route_prefix;
                    }
                    if ( _options.route_suffix ) {
                        this.route_suffix = _options.route_suffix;
                    }

                    // check if the app is using a router
                    this.options.routed = isFunc(this.setRoute);

                    // set default animation type
                    this.options.animation_type = _options.animation_type || 'slide';

                    // check the init queue for deferred tasks
                    if ( q = this.init_queue.length ) {
                        while ( q-- ) {
                            task = this.init_queue[q];
                            // each task should be a `function` that takes a deferred object and returns a promise
                            if ( isFunc(task) ) {
                                this.init_queue[q] = task.call(this, uijet.Promise());
                            }
                        }
                    }
                    // no tasks in queue
                    else {
                        this.init_queue = [{}];
                    }

                    // after all tasks resolve
                    this.whenAll( this.init_queue )
                        .then(function () {
                            // build and init declared widgets
                            // notice that here all modules are already loaded so this will run through
                            that.start(declared_widgets, true);

                            //when all declared widgets are initialized, set `uijet.initialized` to `true`
                            that.initialized = true;
                            // kick-start the GUI - unless ordered not to
                            _options.dont_start || that.startup();
                        });
                }
                // no options given
                else {
                    this.initialized = true;
                    // kick-start
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
            return this.importModules(this._extractDependencies(declared_widgets), _init.bind(this, options));
        },
        /**
         * Caches a definition of a widget in uijet.
         * 
         * @param {String} _name   - identifier for the widget
         * @param {Object} _props  - the widget's prototype
         * @param {Object} [_deps] - dependencies for this widget (widgets and mixins)
         * @returns {Object} this
         * @private
         */
        _define             : function (_name, _props, _deps) {
            widget_definitions[_name] = {
                proto   : Create(_props, true),
                deps    : _deps
            };
            return this;
        },
        /**
         * Generates a widget class on top of @see BaseWidget.
         * Assumes all given dependencies (mixins and widgets) are already loaded
         * and registered with uijet.
         * 
         * @param {Object} _props           - this widget's prototype
         * @param {String|Array} [_mixins]  - mixin dependencies
         * @param {String|Array} [_widgets] - widget dependencies
         * @returns {Function} class        - the generated widget class
         * @throws {Error}                  - missing widget/mixin dependency
         * @private
         */
        _generate           : function (_props, _mixins, _widgets) {
            // create the base class
            var _class = this.BaseWidget,
                _mixins_copy = toArray(_mixins),
                _mixins_to_use = [],
                _mixin, _widget, _widgets_copy, def, m;
            // if we have widgets to build on then mix'em
            if ( _widgets && _widgets.length ) {
                // copy widgets dependencies
                _widgets_copy = toArray(_widgets);
                // loop over them
                while ( _widget = _widgets_copy.shift() ) {
                    // if they're defined
                    if ( def = widget_definitions[_widget] ) {
                        // add them to the chain
                        // just like stacking turtles
                        _class = Create(def.proto, _class, true);
                        // check if they have dependencies
                        if ( def.deps && def.deps.mixins ) {
                            _mixins_to_use = toArray(def.deps.mixins);
                        }
                    }
                    else {
                        throw new Error('Missing widget dependency: ' + _widget);
                    }
                }
            }
            // now we add this widget to the stack
            _class = Create(_props, _class, true);
            // if we have mixins to mix then mix'em
            if ( _mixins_copy ) {
                // if a widget in dependencies had mixins in its dependencies
                if ( m = _mixins_to_use.length ) {
                    for ( ; _mixin = _mixins_to_use[--m]; ) {
                        // add every mixin form the parents' mixins that's not in the list to its beginning
                        if ( !~ _mixins_copy.indexOf(_mixin) ) {
                            _mixins_copy.unshift(_mixin);
                        }
                    }
                }
                // copy mixins dependencies
                _mixins_to_use = _mixins_copy;
            }
            while ( m = _mixins_to_use.shift() ) {
                // if they're defined
                if ( _mixin = mixins[m] ) {
                    // add them to the chain
                    // stack those madafakas
                    _class = Create(_mixin, _class, true);
                }
                else {
                    throw new Error('Missing mixin dependency: ' + m);
                }
            }
            return _class;
        },
        /**
         * Performs all the work for @see uijet.start.
         * 
         * @param {Object} widget                - a widget declaration
         * @param {Boolean} [skip_import]        - whether to skip module import. Defaults to falsy.
         * @returns {Promise|Object} promise|this - a promise object if not skipping import, otherwise `this`
         * @private
         */
        _start              : function (widget, skip_import) {
            var that = this,
                _factory = widget.factory,
                _config = widget.config,
                _type, _dfrd_start, _self, mixedin_type, _w, l, _d, _c, _mixins, _adapters, _widgets;
            // if this is a  cached factory declaration
            if ( _factory && widget_factories[_factory] ) {
                // use it to generate an instance's declaration
                widget = widget_factories[_factory](_config);
            }
            _type = widget.type;
            _config = widget.config;
            // if falsy then import dependencies first and then do the starting
            if ( ! skip_import ) {
                _dfrd_start = this.Promise();
                // the import's callback
                _self = function () {
                    that._start(widget, true);
                    _dfrd_start.resolve();
                    return this;
                };
                // do import
                this.importModules(this._extractDependencies([widget]), _self);
                return _dfrd_start.promise();
            }
            // skip import
            else {
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
                }
                else {
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
        /**
         * Registers a widget into the uijet sandbox.
         * uijet uses the `widget.id` to register the widget.
         * If this instance has a configured `container` in its `options` it's used as
         * the identifier of its container widget instance.
         * If not it climbs up the DOM tree looking for a `uijet_widget` class. The first
         * element's id that has this class is used as the container.
         * If none was found and it reached the `body` element then this instance will be
         * registered as a top level widget. This, for example, means that, unless configured
         * not to, once uijet starts this widget will be awaken automatically.
         * 
         * @param {Object} widget - a widget's instance to register
         * @returns {Object} this
         */
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
            // no container set or found
            if ( ! _current.container ) {
                // register this widget as a top level widget
                widgets.__app__.contained.push(_id);
                _current.container = '__app__';
            }
            return this;
        },
        /**
         * Removes a widget from the uijet sandbox registry.
         * This is usually triggered by a widget when its `destroy()` method is called.
         * 
         * @param {Object} widget - a widget's instance to unregister
         * @returns {Object} this
         */
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
        /**
         * Caches widget declarations before uijet is initialized, 
         * for lazy starting them at the end of its initialization.
         * 
         * It's best to declare widgets in the order of their appearance
         * in the widgets tree (usually maps one-to-one to the DOM tree), so that
         * a widget is always declared before its contained widgets are declared, and so on.
         * 
         * In some cases it's a must to declare widgets in a specific order ( @see position ).
         * 
         * A declaration object usually contains `type` and `config` properties.
         * It may also contain a `factory` property, instead of the `type` one, if
         * this is an instance that's using a pre-declared widget factory.
         * 
         * * `type`: a `String` that identifies a widget class created using `uijet.Widget(type, ...)`.
         * * `factory`: a `String` that identifies a widget factory created using `uijet.Factory(factory, ...)`.
         * * `config`: an `Object` that is used as the widget's `options`.
         * 
         * __note__: For valid instance options see related module.
         * 
         * @param {Object|Array} declarations - a single declaration or a list of declaration objects
         * @returns {Object} this
         */
        declare             : function (declarations) {
            if ( isObj(declarations) ) {
                declared_widgets.push(declarations);
            }
            else if ( isArr(declarations) ) {
                declared_widgets = declared_widgets.concat(declarations);
            }
            return this;
        },
        /**
         * Ad-hoc constructs and initializes widget instance(s) from a given widget declaration(s).
         * For explanations on widget declarations @see uijet.declare.
         * Returns a @see Promise that is resolved once all declared instances finished initializing,
         * or gets rejected if something fails.
         * 
         * `skip_import` is used to forcibly skip modules importing, so this method
         * will complete synchronously, otherwise it will check for missing modules to import.
         * Usually you should _not_ have to specify it at all, unless you know what you're doing
         * and want to optimize this call a bit.
         *
         * @param {Object|Array} declarations     - a single declaration or a list of declaration objects
         * @param {Boolean} [skip_import]         - whether to skip module import. Defaults to falsy.
         * @returns {Promise|Object} promise|this - a promise object if not skipping import, otherwise `this`
         * @throws {Error}                        - if `declarations` is neither an `Array` nor an `Object`
         */
        start               : function (declarations, skip_import) {
            var i, dfrd_starts, _c;
            // if `declarations` is an `Object`
            if ( isObj(declarations) ) {
                // do the starting
                return this._start(declarations, skip_import);
            }
            // if it's an `Array`
            else if ( isArr(declarations) ) {
                i = 0;
                dfrd_starts = [];
                // loop over the widget declarations in it
                while ( _c = declarations[i] ) {
                    // and start every one of them
                    dfrd_starts[i] = this._start(_c, skip_import);
                    i+=1;
                }
                // return a promise of all `declarations` started
                return this.whenAll(dfrd_starts);
            }
            throw new Error('`widgets` must be either an Object or an Array. Instead got: ' + objToString.call(declarations));
        },
        /**
         * Extracts widgets' dependencies modules to be imported from a list of 
         * standard widget instance declarations ( @see uijet.declare ).
         * 
         * @param {Array} declarations  - 
         * @returns {{widgets: Array, mixins: Array, adapters: Array}}
         * @private
         */
        _extractDependencies: function (declarations) {
            var deps = {
                    widgets : [],
                    mixins  : [],
                    adapters: []
                },
                _w, _m, _m_type, _m_list;
            for ( var i = 0 ; _w = declarations[i] ; i++ ) {
                if ( _m_type = _w.type ) {
                    // if this widget type wasn't loaded and isn't in the dependencies list then add it
                    (widget_classes[_m_type] || ~ deps.widgets.indexOf(_m_type)) || deps.widgets.push(_m_type);
                }
                // check for adapters option
                if ( _m_list = toArray(_w.config.adapters) ) {
                    for ( var n = 0 ; _m = _m_list[n++] ; ) {
                        // grab each one and add it if it wasn't loaded before and not already in the list
                        (adapters[_m] || ~ deps.adapters.indexOf(_m)) || deps.adapters.push(_m);
                    }
                }
                // check for mixins option and give it the same treatment like we did with adapters
                if ( _m_list = toArray(_w.config.mixins) ) {
                    for ( n = 0 ; _m = _m_list[n++] ; ) {
                        (mixins[_m] || ~ deps.mixins.indexOf(_m)) || deps.mixins.push(_m);
                    }
                }
            }
            return deps;
        },
        /**
         * Imports all missing modules
         * 
         * @param {Object} modules
         * @param {Function} callback
         * @returns {*}
         */
        // ## uijet.importModules
        // @sign: importModules(widgets, callback)  
        // @returns: require() OR callback() OR uijet
        //
        // Takes an `Array` of widget definitions - `widgets` (type & config), derives the dependencies from
        // each definition into a list of modules to load.  
        // At the end checks for any module that's not already loaded and loads them.  
        // If it needs to load anything it fires `callback` after load is finished,
        // If there's nothing to load or AMD isn't in use it returns the call to `callback` OR `uijet`.
        importModules       : function (modules, callback) {
            var imports = [], m, l;
            // if using an AMD loader
            if ( typeof _window.require == 'function' ) {
                // create list of modules to import with paths prepended
                for ( m in modules )
                    if ( m in import_paths )
                        for ( l = modules[m].length; l-- ; )
                            imports.push(import_paths[m] + modules[m][l]);
                // if there's anything to import
                if ( imports.length ) {
                    // import it
                    return _window.require(imports, callback);
                }
            }
            // if nothing to import or not using AMD
            // then fire `callback` and return it or simply `uijet`
            return callback ? callback() : this;
        },
        // ## uijet.startup
        // @sign: startup()  
        // @returns: uijet
        //
        // Starts up uijet and publishes this event across the app.  
        // If the `pre_startup` callback is defined it will run in the beginning.  
        // At the end fires the `startup` event.
        startup             : function () {
            var pre_startup = this.options.pre_startup;
            isFunc(pre_startup) && pre_startup();
            // listen to clicks around the app to notify about idle user interaction
            uijet.$element.on(uijet.support.click_events.full, function (e) {
                uijet.publish('app.clicked', e);
            });
            this.$element[0].style.visibility = 'visible';
            this.publish('startup');

            if ( ! views.length && ! this.options.dont_wake ) {
                this.wakeContained('__app__');
            }

            return this;
        },
        // ## uijet.wakeContained
        // @sign: wakeContained(id, [context])  
        // @returns: deferred_widgets
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
                if ( _widget && ! returnOf(_widget.options.dont_wake, _widget) ) {
                    deferreds.unshift(_widget.wake(context));
                }
            }
            return deferreds;
        },
        // ## uijet.sleepContained
        // @sign: sleepContained(id)  
        // @returns: uijet
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
        // @returns: uijet
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
        position            : function (widget, exclude) {
            var container_id = widgets[widget.id].container,
                siblings = container_id ? widgets[container_id].contained || [] : [], sibling,
                position = {position: 'absolute', top: 0, bottom: 0, right: 0, left: 0},
                processed = {},
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
                        if ( !~ exclude.indexOf(p) ) {
                            if ( p in processed ) {
                                if ( processed[p].unit === processed_position[p].unit &&
                                    processed[p].size < processed_position[p].size ) {
                                    processed[p].size = processed_position[p].size;
                                }
                            }
                            else {
                                processed[p] = processed_position[p];
                            }
                        }
                    }
                }
            }
            if ( set_style ) {
                for ( p in processed ) {
                    position[p] = processed[p].size + processed[p].unit;
                }
            }
            else {
                // if there's something to set then make sure it's set
                for ( p in position ) {
                    set_style = true;
                    break;
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
        // @returns: uijet
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
        // @returns: uijet
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
        // @returns: uijet
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
        // @returns: uijet
        //
        // Sets a route in the app that will call the widget's run method.  
        // If `route` is NOT supplied then the route is taken using `widget.getRoute()`.  
        // It is possible to supply `route` as an `object` when other characteristics of the route
        // need to be taken into account, such as the REST method, etc.
        // An optional third argument `callback` can be used to replace the default `uijet.run` method.
        // For example, if you need to set a route of a Form's submit with the submit method.

        //setRoute            : function (widget, route, callback) {},


        // # -NOT IMPLEMENTED-
        // ## uijet.unsetRoute
        // @sign: unsetRoute(widget, [route])  
        // @returns: uijet
        //
        // Removes a set route from the routes registry.  
        // Arguments can be supplied for all cases as explained for `uijet.setRoute` above.

        //unsetRoute          : function (widget, route) {},


        // # -NOT IMPLEMENTED-
        // ## uijet.runRoute
        // @sign: runRoute(route, [is_silent])  
        // @returns: uijet
        //
        // Runs a set route.  
        // The second `is_silent` argument can be used to differentiate between 2 types of routing:
        //
        // 1. When `true`: call the route handler but don't propagate the route to the browsers' address bar (possible
        //    to neither push this state to the HTML5 history object.
        // 2. When `false`: Propagate this route to the address bar and the activation of the route handler will follow.

        //runRoute            : function (route, is_silent) {},


        // ## uijet.isiPad
        // @sign: isiPad()  
        // @returns: uijet
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
        // @returns: uijet
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
        // @returns: uijet
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
                            }
                            else {
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
        // @returns: context
        //
        // Builds a context `Object` from the returned arguments of a route.  
        // Named parameters in `route` are indexed in the context obejct by their name.  
        // Unnamed parameters are indexed by their index in `args_array`.
        buildContext        : function (route, args_array) {
            var context = {},
                named_arg_re = /.*:([-\w]+)/,
                parts = route.split('/'),
                i = 0, n = 0,
                part, match, splat_parts;
            args_array = toArray(args_array);
            while ( part = parts[i++], typeof part == 'string' ) {
                // if it's a named argument
                if ( match = part.match(named_arg_re) ) {
                    // then add it to the context by name
                    context[match[1]] = args_array.shift();
                    n += 1;
                }
                else if ( ~ part.indexOf('(') ) {
                    // if it's unnamed then add it by its index in `args_array`
                    context[n] = args_array.shift();
                    n += 1;
                }
                else if ( part[0] == '*' ) {
                    splat_parts = args_array.shift().split('/');
                    while ( part = splat_parts.shift() ) {
                        context[n] = part;
                        n += 1;
                    }
                }
            }
            return context;
        }
    };

    // set a namespace on uijet for utility functions.
    uijet.utils = {
        extend          : extend,
        extendProto     : extendProto,
        extendProxy     : extendProxy,
        Create          : Create,
        isObj           : isObj,
        isArr           : isArr,
        isFunc          : isFunc,
        toArray         : toArray,
        returnOf        : returnOf,
        toElement       : toElement,
        rethrow         : rethrow,
        contains        : contains,
        getStyle        : getStyle,
        getStyleProperty: getStyleProperty,
        getOffsetOf     : getOffsetOf,
        putMixin        : function putMixin (array, name, position) {
            var index;
            if ( ! array ) {
                return [name];
            }
            else if ( ! isArr(array) ) {
                return putMixin([array], name, position);
            }
            else {
                position = typeof position == 'number' ? position : array.length;

                index = array.indexOf(name);
                if ( ~ index ) {
                    if ( index === position ) return array;
                    array.splice(index, 1);
                }
                array.splice(position, 0, name);
            }
            return array;
        },
        // wrap these objects since they point to native objects which is forbidden  
        // You Maniacs! You blew it up! Ah, damn you!
        requestAnimFrame: function (f) { return requestAnimFrame(f); },
        cancelAnimFrame : function (id) { return cancelAnimFrame(id); }
    };

    uijet.Base = Base;

    return uijet;
}));
