/*!
 * uijet UI Framework
 * @version 0.0.76
 * @license BSD License (c) copyright Yehonatan Daniv
 * https://raw.github.com/ydaniv/uijet/master/LICENSE
 */
;
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['pubsub', 'promises', 'dom'], function (pubsub, promises, dom) {
            return factory(root, pubsub, promises, dom);
        });
    }
    else {
        root.uijet = factory(root);
    }
}(this, function (_window, pubsub, promises, dom) {
    /*
     * uijet's globals and some local caching of stuff from global namespace
     */
    var Function = _window.Function,
        Object = _window.Object,
        Array = _window.Array,
        BROWSER_PREFIX = {
            style     : ['webkit', 'Moz', 'O', 'ms'], prop: [
                'WebKit', 'webkit', 'moz', 'o', 'ms'
            ], matches: {}
        },
        // regexp for simple string format
        SUBSTITUTE_RE = /\{([^\s\}]+)\}/g,
        // native utilities caching
        objToString = Object.prototype.toString,
        arraySlice = Array.prototype.slice,
        // sandbox's registries
        mixins = {},
        adapters = {},
        declared_widgets = [],
        widgets = { __app__: { contained: [], id: '__app__' } },
        resources = {},
        // caching pre-built predefined widget classes
        // `{ proto : widget_prototype, deps : dependencies }`
        widget_definitions = {},
        // caching built widget classes - NOT mixed-in
        widget_classes = {},
        // caching built and mixed-in widget classes
        widget_mixedin_classes = {},
        // caching widget declaration factories
        widget_factories = {},
        // constants
        TOP_ADAPTER_NAME = 'TopAdapter',
        /**
         * Utility for deferring a function by adding it to the process queue.
         *
         * @method
         * @memberOf uijet.utils
         * @param {function} f - the function to defer.
         */
        async = _window.setImmediate ?
                function (f) {
                    _window.setImmediate(f);
                } :
                function (f) {
                    _window.setTimeout(f, 0);
                },
        /**
         * Searches for a prefixed name of `name` inside `obj`.
         *
         * @memberOf uijet.utils
         * @param {string} name - Name to search for.
         * @param {object} obj - The source object search in.
         * @returns {string|null} - The prefixed property or `null` if not found.
         */
        getPrefixed = function (name, obj) {
            var cases = BROWSER_PREFIX.prop,
                len = cases.length, prop;
            while ( len -- ) {
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
                   function (callback) {
                       return _window.setTimeout(callback, 1000 / 60);
                   };
        }()),
        /**
         * Polyfill for cancelAnimationFrame
         */
        cancelAnimFrame = (function () {
            return _window.cancelAnimationFrame ||
                   getPrefixed('CancelRequestAnimationFrame', _window) ||
                   getPrefixed('CancelAnimationFrame', _window) ||
                   function (requestId) {
                       return _window.clearTimeout(requestId);
                   };
        }()),
        // check for touch support
        has_touch = ! ! (('ontouchstart' in _window) || _window.DocumentTouch && document instanceof DocumentTouch),
        /**
         * Checks if given argument is an `Array`.
         * Uses {@see Array.isArray} by default if it exists.
         *
         * @method
         * @memberOf uijet.utils
         * @param {*} obj - target object to check.
         * @returns {boolean} - whether `obj` is an `Array`.
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
                // the inner copy of the initial arguments
                args = arraySlice.call(arguments, 1);
            return function () {
                // each call to the bound function will create a new copy
                // of `args` and add to it its own arguments
                return _self.apply(scope, args.concat(arraySlice.call(arguments)));
            };
        };
    }
    /**
     * Checks if given argument is an `Object`.
     *
     * @memberOf uijet.utils
     * @param {*} obj - target object to check.
     * @returns {boolean} - whether `obj` is an `Object`.
     */
    function isObj (obj) {
        return objToString.call(obj) == '[object Object]';
    }

    /**
     * Checks if argument `obj` is an `Function`.
     *
     * @memberOf uijet.utils
     * @param {*} obj - target object to check.
     * @returns {boolean} - whether `obj` is an `Function`.
     */
    function isFunc (obj) {
        return typeof obj == 'function';
    }

    /**
     * Checks if given argument is an `Arguments` object.
     *
     * @param {*} obj - target object to check.
     * @returns {boolean} - whether `obj` is an `Arguments` object.
     */
    function isArgs (obj) {
        return objToString.call(obj) == '[object Arguments]';
    }

    /**
     * Utility for either wrapping an argument with an `Array` or return a copy of that array.
     * If an array-like object is given then converts it into a plain `Array`.
     * If the argument supplied is `undefined` or no arguments are supplied then returns `undefined`.
     *
     * @memberOf uijet.utils
     * @param {*} obj - target object to check.
     * @returns {Array|undefined} - an `Array` copy of `obj` or `undefined`.
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
     * Returns an interpolated string based on a given template,
     * a string format pattern and a data context.
     *
     * `data` can be either an Object, in which case replacement
     * is done based on keywords matching, or an Array, in which
     * replacement is done based on order.
     *
     * The template format is `{param}` with no whitespace allowed inside.
     *
     * @memberOf uijet.utils
     * @param template {string} - template string to interpolate on.
     * @param {Object|string[]} [data] - data context object to use as lookup for interpolation.
     * @returns {string}
     */
    function format (template, data) {
        var use_keys = isObj(data),
            n = 0;
        return template.replace(SUBSTITUTE_RE, function (match, key) {
            return use_keys ? data[key] : data[n ++];
        });
    }

    /**
     * Gets the computed style object (`CSSStyleDeclaration`) of an `HTMLElement` `el`.
     * If `prop` is supplied they return it's value.
     * If a list of properties `prop` is supplied then return a corresponding list of values.
     * An optional pseudo-element argument can be used to fetch its style.
     * If the element is a decendent of a window object that isn't this global namespace
     * you can supply that window object as fourth argument.
     *
     * @memberOf uijet.utils
     * @param {HTMLElement} el - the element to use.
     * @param {string|string[]} [prop] - the property to fetch or list of properties.
     * @param {string} [pseudo] - a name of a pseudo-element of that element to get its style.
     * @param {HTMLWindowElement} [win] - The window element that element `el` belongs to.
     * @returns {string|string[]|CSSStyleDeclaration} - the read-only style object of that element or the value[s] of that property[ies].
     */
    function getStyle (el, prop, pseudo, win) {
        var style = (win || _window).getComputedStyle(el, pseudo || null), res, p;
        if ( prop ) {
            if ( isArr(prop) ) {
                res = {};
                for ( var i = 0; p = prop[i ++]; ) {
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
     * Any additional parameters after `ctx` are sent as arguments to call of `arg`.
     *
     * @memberOf uijet.utils
     * @param {*} arg - argument to check if callable and return its call or itself if not.
     * @param {Object} [ctx] - context object to use for the call.
     * @returns {*} - the argument or its `.call()`'s product.
     */
    function returnOf (arg, ctx) {
        return isFunc(arg) ? arg.apply(ctx || _window, arraySlice.call(arguments, 2)) : arg;
    }

    /**
     * Parses and formats a URL into an object containing `method`
     * and `path` for making a proper RESTful request.
     *
     * @memberOf uijet.utils
     * @param {string|Object} url - The URL to use for the request or an `Object` in the form of `{ method: <method>, path: <path>}`.
     * @param {Object} [context] - context object to use for formatting the URL.
     * @returns {{method: (string), path: (string)}}
     */
    function parseRestUrl (url, context) {
        var path;
        // if we have a URL to send to
        if ( url ) {
            if ( typeof url == 'string' ) {
                // parse the URL
                path = format(url, context);
            }
            else if ( isObj(url) ) {
                // or parse the URL under `path`
                path = format(url.path, context);
            }
            else {
                return;
            }
            return {
                method: url.method || 'GET',
                path  : path || (url.path ? url.path : url)
            };
        }
    }

    /**
     * Normalizes `obj` into a wrapped DOM element object via the used DOM module,
     * if it's either a string or an HTMLElement.
     *
     * @memberOf uijet.utils
     * @param {string|HTMLElement} obj - either a query string or an HTMLElement to wrap.
     * @returns {*} - the wrapped object or simply `obj`.
     */
    function toElement (obj, context) {
        if ( obj && (typeof obj == 'string' || obj.nodeType === 1) ) {
            obj = uijet.$(obj, context || document);
        }
        return obj;
    }

    /**
     * Shallow (or deep) copy `Object`s (`Array`s are shallow copied).
     * If first argument is `true` then does a deep copy.
     * First (or second if first is a `Boolean`) argument is the target object to copy to,
     * all subsequent arguments are source objects to copy from.
     * Objects are copied to target from left to right.
     *
     * @memberOf uijet.utils
     * @param {Object|boolean} target - the target object or `true` for deep copying.
     * @param {...Object} [source] - the target object if deep copying or a source object(s).
     * @returns {Object} - the target object.
     */
    function extend (target, source) {
        var args = arraySlice.call(arguments, 1),
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
     * Shallow (or deep) copy `Object`s (`Array`s are shallow copied).
     * If first argument is `true` then does a deep copy.
     * First (or second if first is a `Boolean`) argument is the source object to copy from.
     *
     * @memberOf uijet.utils
     * @param {Object|boolean} source - the source object to copy or `true` for deep copying.
     * @returns {Object} - the copy object of `source`.
     */
    function copy (source) {
        var target = {},
            is_deep, s;

        if ( typeof source == 'boolean' ) {
            is_deep = source;
            source = arguments[1];
        }

        for ( s in source ) {
            if ( isObj(source[s]) ) {
                target[s] = copy(is_deep, source[s]);
            }
            else if ( isArr(source[s]) ) {
                target[s] = source[s].map(function mapper (item) {
                    return isObj(item) ? copy(is_deep, item) :
                           isArr(item) ? item.map(mapper) :
                           item;
                });
            }
            else {
                target[s] = source[s];
            }
        }

        return target;
    }

    /**
     * Deep copy (prototype) objects (Arrays are shallow copied), {@see extend}.
     * If a property of same name exists in both source and target then if that property is:
     *
     * * `Object`: deep copy.
     * * `function`: target method is wrapped to support a super call to the source method.
     * * otherwise: shallow copy
     *
     * First argument is the target object to copy to.
     * All subsequent arguments are source objects to copy from.
     * Objects are copied to target from left to right.
     *
     * @memberOf uijet.utils
     * @param {Object} target - the target object.
     * @param {...Object} [source] - the source object(s).
     * @returns {Object} - the target object.
     */
    function extendProto (target, source) {
        var args = arraySlice.call(arguments, 1),
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
     * Shallow copy properties while making sure functions are bound to `context`, {@see extend}.
     * Usually used in {@see uijet.use}.
     *
     * @memberOf uijet.utils
     * @param {Object} target - target object to extend.
     * @param {Object} source - source object to copy from.
     * @param {Object} [context] - optional context object to bind `Function` properties to.
     * @returns {Object} - the target object.
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
     * @param {function} source - source constructor to take methods from.
     * @param {function} target - target constructor for copying the methods to.
     * @returns {function} - the target constructor.
     */
    function copyStaticMethods (source, target) {
        for ( var m in source ) {
            if ( source.hasOwnProperty(m) && isFunc(source[m]) ) {
                target[m] = source[m];
            }
        }
        return target;
    }

    /**
     * Base class for components.
     * Defines events and signals APIs plus some OO extensions.
     *
     * @constructor
     * @class Base
     * @memberOf uijet
     */
    function Base () {
        this.signals_cache = {};
        this.signals = Object.create(this.signals_cache);
        this._memoize_signal_args = {};
    }

    /**
     * Extends this class' prototype with another object's properties.
     *
     * @memberOf Base
     * @static
     * @param {Object} props - properties to deep copy to the `prototype`.
     * @returns {Object} - the prototype of this class.
     */
    Base.extend = function (props) {
        return extend(true, this.prototype, props);
    };
    /**
     * Creates a new class that is composed of the given class or Object and inherits this class.
     *
     * @memberOf Base
     * @static
     * @param {Object|function} child - the child class or Object that will be copied and used to inherit this class.
     * @returns {function} - constructor of the new created class.
     */
    Base.derive = function derive (child) {
        return copyStaticMethods(this, Create(child, this));
    };
    /**
     * Creates a new class that is composed of this class and will inherit the given class or Object.
     *
     * @memberOf Base
     * @static
     * @param {Object} parent - the parent class or Object that will be copied and used as the parent of this class.
     * @returns {function} - constructor of the new created class.
     */
    Base.inherit = function inherit (parent) {
        return copyStaticMethods(this, Create(this, parent));
    };

    /**
     * Public, inheritable methods of {@see Base} class.
     */
    Base.prototype = {
        constructor  : Base,
        /**
         * Registers the widget into uijet's sandbox and sets the instance's resource.
         *
         * **note**: It is recommended to call `this._super()` first thing
         * when overriding this method, to make sure the widget is in the sandbox.
         *
         * #### Related options:
         *
         * * `resource`: a name of a registered resource or an object to use as a resource.
         * * `resource_name`: a key to use when referencing the model's attributes form the `context` object.
         * Defaults to the `resource` option if it's a `string`, otherwise to `'<this.id>_data'`.
         *
         * @method uijet.Base#register
         * @returns {uijet.Base}
         */
        register     : function () {
            if ( ! this.registered ) {
                uijet._register(this);
                this.registered = true;

                this._setResource();
            }
            return this;
        },
        /**
         * Unregisters the widget from uijet's sandbox.
         *
         * @method uijet.Base#unregister
         * @returns {uijet.Base}
         */
        unregister   : function () {
            uijet._unregister(this);
            this.registered = false;
            return this;
        },
        /**
         * Registers a handler for the given type.
         *
         * @memberOf uijet.Base
         * @instance
         * @param {string} topic - the signal's type to register.
         * @param {function} handler - the signal's handler to register.
         * @returns {uijet.Base}
         */
        listen       : function (topic, handler) {
            this.signals_cache[topic] = this._parseHandler(handler);
            return this;
        },
        /**
         * Removes a handler of the given type.
         * If no `topic` is given then removes all handlers.
         *
         * @memberOf uijet.Base
         * @instance
         * @param {string} [topic] - the signal's type to remove.
         * @returns {uijet.Base}
         */
        unlisten     : function (topic) {
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
         * {@see Base} does not define a `_finally` method that is used to clean up these "once" states.
         *
         * @memberOf uijet.Base
         * @instance
         * @param {boolean} [once] - optional `true` flag to make sure this signal is notified once per lifecycle stage.
         * @param {string} topic - the name of the signal to notify.
         * @param {...*} [args] - arguments to hand over to the signal's handler.
         * @returns {*} - returned result of the triggered handler or `undefined`.
         */
        notify       : function (topic, args) {
            var handler, own_args_len = 1, once = false;
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
         * Holds a signal's handler from being triggered.
         *
         * @memberOf uijet.Base
         * @instance
         * @param {string} topic - the name of the signal to hold.
         * @returns {uijet.Base}
         */
        holdSignal   : function (topic) {
            this.signals[topic] = function () {
                var args = arraySlice.call(arguments);
                // add topic to arguments
                args.unshift(topic);
                // if this topic is set to `null` then it's `once` call
                if ( this.signals.hasOwnProperty(topic) && this.signals[topic] === null ) {
                    // add `true` to arguments for `once`
                    args.unshift(true);
                }
                // remember the arguments we used
                this._memoize_signal_args[topic] = args;
            };
            return this;
        },
        /**
         * Releases and triggers a held signal.
         * The handler is invoked with the arguments it was provided
         * with on previous calls to {@link Base#notify} with same `topic`.
         *
         * @memberOf uijet.Base
         * @instance
         * @param {string} topic - the signal to release and trigger.
         * @returns {*} - the result of signal handler's call.
         */
        releaseSignal: function (topic) {
            var args;
            if ( args = this._memoize_signal_args[topic] ) {
                delete this.signals[topic];
                delete this._memoize_signal_args[topic];
            }
            return this.notify.apply(this, args || arguments);
        },
        /**
         * Registers the given handler under the given type `topic`.
         * If `handler` is a `Function` it is bound to this instance as its context.
         * If `handler` is a `String` it is used to find a method of same name to use as handler.
         * If no method was found then a signal with same type's handler is used.
         * If `handler` is a `String` and ends with a '+' then the `arguments` supplied to this
         * handler will be passed to that method/signal handler.
         *
         * @memberOf uijet.Base
         * @instance
         * @param {string} topic - the type of the handler to register.
         * @param {function|string} handler - the handler to register or a name of a method of this instance or a signal's handler to use as handler.
         * @returns {uijet.Base}
         */
        //TODO: change the implementation to support an array of handlers per topic so this won't simply replace existing handlers
        subscribe    : function (topic, handler) {
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
         * @memberOf uijet.Base
         * @instance
         * @param {string} topic - the event type to remove from registry.
         * @param {function} [handler] - the handler to remove from the registry.
         * @returns {uijet.Base}
         */
        unsubscribe  : function (topic, handler) {
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
         * @memberOf uijet.Base
         * @instance
         * @param {string} topic - the type of the event to trigger.
         * @param {*} [data] - argument to pass to the event's handler as data.
         * @returns {uijet.Base}
         */
        publish      : function (topic, data) {
            uijet.publish(this.id + '.' + topic, data);
            return this;
        },
        /**
         * Assigns the resource to `this.resource`.
         *
         * #### Related options:
         *
         * * `resource`: a name of a registered resource or an object to use as a resource.
         * * `resource_name`: a key to use when referencing the model's attributes form the `context` object.
         * Defaults to the `resource` option if it's a `string`, otherwise to `'<this.id>_data'`.
         *
         * @private
         * @method uijet.Base#_setResource
         * @returns {uijet.Base}
         */
        _setResource : function () {
            var resource_name = this.options.resource_name,
                resource;

            if ( resource = this.options.resource ) {
                if ( typeof resource == 'string' ) {
                    this.resource = uijet.Resource(resource);

                    if ( ! resource_name ) {
                        resource_name = resource;
                    }
                }
                else {
                    this.resource = resource;

                    if ( ! resource_name ) {
                        resource_name = this.id + '_data';
                    }
                }

                this._resource_name = resource_name;
            }
            return this;
        },
        /**
         * Normalizes a `handler` into a function if it's a `String`.
         *
         * If `handler` is a:
         *
         * 1. Method of this instance -> use this method.
         * 2. A registered signal handler -> use this handler.
         * 3. Otherwise -> create a new function that publishes this string as an event.
         *
         * * If `handler` ends with `'+'` then it will be invoked with the arguments sent to it as its parameters.
         * * If `handler` starts with a `'-'` then it will be published as global event with the `<id>.` prefix.
         *
         * @memberOf uijet.Base
         * @instance
         * @param {string|function} handler - a handler or a string representation of a handler.
         * @returns {function} - the parsed handler.
         * @private
         */
        _parseHandler: function (handler) {
            var that = this,
                apply_args = false,
                is_global = false,
                _h;

            // if handler is a string
            if ( typeof handler == 'string' ) {
                // if ends with a '+'
                if ( handler[handler.length - 1] == '+' ) {
                    // use `apply` and pass arguments on invocation
                    apply_args = true;
                    handler = handler.slice(0, - 1);
                }
                // if starts with a '-'
                if ( handler[0] == '-' ) {
                    // make a global event
                    is_global = true;
                    handler = handler.slice(1);
                }
                // if there's a method by this name
                if ( isFunc(this[handler]) ) {
                    _h = function () {
                        that[handler].apply(that, apply_args ? arguments : []);
                    };
                }
                // if there's a signal by this name
                else if ( isFunc(this.signals_cache[handler]) ) {
                    _h = function () {
                        var args = toArray(arguments);
                        args.unshift(handler);
                        that.notify.apply(that, apply_args ? args : [handler]);
                    };
                }
                // otherwise make it an event to publish
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
     * Normalizes a name of a dependency or an array names of dependencies into a standard dependencies object
     * with a `mixins` key mapped to an `Array` of names of Mixins and `widget` key mapped to a Widget's name.
     *
     * According to the `deps` argument it behaves as follows:
     *
     * * `string` it's assumed to be a name of a widget.
     * * `Array` it's assumed to be a list of mixin names.
     * * `Object` it's assumed to be a standard dependencies object with a `mixins` key normalized to an `Array` and a `widget`.
     * * Falsy arguments yield `undefined`
     *
     * @param {*} deps - the dependencies to normalize into an `Object`.
     * @returns {Object|undefined} - a standard dependencies object.
     */
    function normalizeDeps (deps) {
        if ( ! deps ) {
            return;
        }
        var _deps = {};
        // if `deps` is an `Object`
        if ( isObj(deps) ) {
            // convert the Mixin dependecies inside it to an `Array`
            _deps.mixins = toArray(deps.mixins) || [];
            _deps.widget = deps.widget || void 0;
        }
        else if ( isArr(deps) ) {
            // if it's an `Array` it's a list of Mixin names, just copy it
            _deps.mixins = toArray(deps);
            _deps.widget = void 0;
        }
        else {
            // otherwise it's a name of a Widget to inherit
            _deps.mixins = [];
            _deps.widget = deps;
        }
        return _deps;
    }

    /**
     * Gets a normalized `object` of dependencies, as returned by {@see normalizeDeps},
     * and checks for modules in it that are not yet defined, in `mixins` and `widget_classes`.
     *
     * If any dependency is missing returns `true`, otherwise `false`.
     *
     * @param {Object} deps - normalized dependencies declaration.
     * @returns {string|boolean} missing - the name of the missing dependency that's not defined yet or `false`.
     */
    function missingDependency (deps) {
        var m, len;
        for ( len = deps.mixins.length; m = deps.mixins[-- len]; ) {
            if ( ! (m in mixins) ) {
                return m;
            }
        }
        if ( deps.widget && ! (deps.widget in widget_classes) ) {
            return deps.widget;
        }
        return false;
    }

    /**
     * Creates a new class from a given prototype object or a constructor function,
     * optionally inheriting the prototype/constructor `_extends`.
     * Returns the created class constructor.
     *
     * @memberOf uijet.utils
     * @param {function|Object} proto - a constructor or an object to use as the top level prototype.
     * @param {function|Object} [_extends] - a constructor of a class to inherit from or simply an object to add to the prototype chain.
     * @returns {function} - the new created class constructor.
     */
    function Create (proto, _extends) {
        var is_proto_f = isFunc(proto),
            is_extends_f = isFunc(_extends),
            _proto = is_proto_f ? proto.prototype : proto;

        function F () {
            // call original constructors
            is_extends_f && _extends.call(this);
            is_proto_f && proto.call(this);
        }

        if ( _extends ) {
            _proto = extendProto(
                Object.create(is_extends_f ? _extends.prototype : _extends),
                _proto
            );
        }

        F.prototype = _proto;

        return F;
    }

    /**
     * Returns the specific name of a style property in the current user-agent, meaning, with the proper vendor
     * prefix if needed and found.
     * If there's no match, prefixed or not, returns `null`.
     * Can also be used to check for the support of that CSS feature in current user-agent.
     *
     * @memberOf uijet.utils
     * @param {string} prop - an un-prefixed name of a style property.
     * @param {boolean} as_css_text - if `true` will return the property prefixed properly to be used as CSS text directly in a style declaration.
     * @returns {string|null} prefixed - the matching name of this property for the current user-agent.
     */
    function getStyleProperty (prop, as_css_text) {
        var style = _window.document.body.style,
            cases = BROWSER_PREFIX.style,
            prefix, camelized, i = 0;
        // return un-prefixed if found
        if ( prop in style ) {
            return prop;
        }
        // check cache
        if ( ! as_css_text && prop in BROWSER_PREFIX.matches ) {
            // return the cached property name
            return BROWSER_PREFIX.matches[prop];
        }
        else {
            // executed once per property
            camelized = prop[0].toUpperCase() + prop.slice(1);
            // try cached prefix
            if ( prefix = BROWSER_PREFIX.prefix ) {
                if ( (prefix + camelized) in style ) {
                    if ( as_css_text ) {
                        return '-' + prefix.toLowerCase() + '-' + prop;
                    }
                    else {
                        // cache result
                        BROWSER_PREFIX.matches[prop] = prefix + camelized;
                        return prefix + camelized;
                    }
                }
            }

            // try all prefixes
            while ( prefix = cases[i ++] ) {
                if ( (prefix + camelized) in style ) {
                    // cache the prefix that worked
                    BROWSER_PREFIX.prefix = prefix;
                    if ( as_css_text ) {
                        return '-' + prefix.toLowerCase() + '-' + prop;
                    }
                    else {
                        // cache the result
                        BROWSER_PREFIX.matches[prop] = prefix + camelized;
                        return prefix + camelized;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Checks if the first element contains the second element.
     *
     * @memberOf uijet.utils
     * @param {HTMLElement} a - container element.
     * @param {HTMLElement} b - contained element.
     * @returns {boolean} contained - whether container contains contained.
     */
    function contains (a, b) {
        return b && (a.contains ?
                    a != b && a.contains(b) :
                    ! ! ( a.compareDocumentPosition(b) & 16 ));
    }

    /**
     * Gets the offset of `child` relative to `parent`.
     *
     * **note**: if `child` is not child of `parent` then the returned result will show only `0`s.
     *
     * @memberOf uijet.utils
     * @param {HTMLElement} child - child element to get its offset.
     * @param {HTMLElement} parent - parent element to use as relative offset parent.
     * @returns {{x: number, y: number}} offset - an object with `x` and `y` keys and `Number`s as values representing offset in pixels.
     */
    function getOffsetOf (child, parent) {
        var result = { x: 0, y: 0 };
        if ( ! child || ! parent || child === parent || ! contains(parent, child) ) {
            return result;
        }
        // loop up the DOM tree until offsetParent is `null`
        do {
            if ( child === parent ) {
                break;
            }
            // aggregate left and top offsets
            result.x += child.offsetLeft;
            result.y += child.offsetTop;
        }
        while ( child = child.offsetParent );
        return result;
    }

    /*
     * Returns a unique set from a given list of items.
     * Used in `uijet.__generate()` for getting a unique list of Mixins.
     *
     * @param {Array} list - list of items to filter.
     * @returns {Array} - the incoming list filtered to contain only unique items.
     */
    function _unique (list) {
        return list.filter(function (m, i, arr) {
            return arr.indexOf(m) === i;
        });
    }

    /*
     * Returns a concatenated list of all Mixin dependencies for a given normalized dependencies object.
     *
     * @param {{mixins: string[], widget: string}} deps - a normalized dependencies object.
     * @returns {string[]}
     */
    function _mergeMixinDeps (deps) {
        if ( ! deps || ! deps.mixins || ! deps.mixins.length ) {
            return [];
        }
        if ( deps.widget ) {
            return deps.mixins.concat(_mergeMixinDeps(widget_definitions[deps.widget]));
        }
        return deps.mixins;
    }

    /*
     * Returns a constructor for a given Widget type.
     *
     * @param {string} type - a name of a cached widget definition.
     * @returns {function} - the fully created widget class constructor.
     */
    function _generateWidgetClass (type) {
        var definition = widget_definitions[type],
            parent;

        // if the class is cached return it
        if ( type in widget_classes ) {
            return widget_classes[type];
        }

        // if there's a parent class to inherit
        if ( parent = (definition && definition.deps && definition.deps.widget) ) {
            // get/generate the parent class, inherit it, cache and return
            return (widget_classes[type] = Create(definition.proto, _generateWidgetClass(parent)));
        }

        // no cache and no parent, just create on top of BaseWidget, cache and return
        return (widget_classes[type] = Create(definition.proto, uijet.BaseWidget));
    }

    function uijet_declare_or_start (declarations) {
        if ( this.initialized || this.initializing ) {
            var i, dfrd_starts, _c;
            // if `declarations` is an `Object`
            if ( isObj(declarations) ) {
                // do the starting
                return uijet.when(this.__start(declarations));
            }
            // if it's an `Array`
            else if ( isArr(declarations) ) {
                i = 0;
                dfrd_starts = [];
                // loop over the widget declarations in it
                while ( _c = declarations[i] ) {
                    // and start every one of them
                    dfrd_starts[i] = this.__start(_c);
                    i += 1;
                }
                // return a promise of all `declarations` started
                return this.whenAll(dfrd_starts);
            }
            throw new Error('`widgets` must be either an Object or an Array. Instead got: ' +
                            objToString.call(declarations));
        }
        else {
            if ( isObj(declarations) ) {
                declared_widgets.push(declarations);
            }
            else if ( isArr(declarations) ) {
                declared_widgets.push.apply(declared_widgets, declarations);
            }
            return uijet.when(this);
        }
    }

    /**
     * The sandbox module.
     *
     * @namespace uijet
     */
    uijet = {
        debug                : true,
        initializing         : false,
        initialized          : false,
        route_prefix         : '',
        route_suffix         : '',
        init_queue           : [],
        /**
         * Detected browser features
         *
         * @member {Object} uijet.support
         * @namespace
         */
        support              : {
            /**
             * Whether this platform supports touch.
             *
             * @member {boolean} uijet.support.touch
             */
            touch        : has_touch,
            click_events : has_touch ?
                // can be replaced with gestures (like 'tap') if handled by other library
            /**
             * Event types in touch supported platforms.
             *
             * @member {Object} uijet.support.click_events
             * @property {string} full - 'touchstart'
             * @property {string} start - 'touchstart'
             * @property {string} move - 'touchmove'
             * @property {string} end - 'touchend'
             */
                           { full: 'touchstart', start: 'touchstart', move: 'touchmove', end: 'touchend' } :
            /**
             * Event types in platforms where touch is not supported.
             *
             * @member {Object} uijet.support.click_events(2)
             * @property {string} full - 'click'
             * @property {string} start - 'mousedown'
             * @property {string} move - 'mousemove'
             * @property {string} end - 'mouseup'
             */
                           { full: 'click', start: 'mousedown', move: 'mousemove', end: 'mouseup' },
            /**
             * Whether this platform supports transforms.
             *
             * @member {string} uijet.support.transform
             */
            transform    : ! ! getStyleProperty('transform'),
            /**
             * Whether this platform supports transitions.
             *
             * @member {string} uijet.support.transition
             */
            transition   : ! ! getStyleProperty('transition'),
            /**
             * Whether this platform supports 3D transforms.
             *
             * @member {boolean} uijet.support.3d
             */
            '3d'         : ! ! getStyleProperty('perspective'),
            /**
             * Holds the name of the `trasitionend` event in this platform.
             *
             * @member {string} uijet.support.transitionend
             */
            transitionend: (function (name) {
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
         * @memberof uijet
         * @param {Object} props - the properties to mix-in to the host
         * @param {Object} [host] - host object to add these properties to, can be skipped by passing `null`
         * @param {Object} [context] - a context object to bind the mixed-in properties to
         * @returns {uijet}
         */
        use                  : function (props, host, context) {
            // get the host object or use `uijet`
            var _host = host || this;
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
         * @memberOf uijet
         * @param {string} type - this widget's type.
         * @param {Object} props - properties defined by this widget.
         * @param {string|Array|Object} [deps] - dependencies for this widget.
         * @returns {uijet}
         */
        Widget               : function (type, props, deps) {
            var _deps = normalizeDeps(deps),
                missing;
            // Cache the widget's definition for JIT creation
            this.__define(type, props, _deps);
            // create and cache the class
            // if we have dependencies
            if ( _deps && ! this.initialized ) {
                if ( missing = missingDependency(_deps) ) {
                    throw new Error('The dependency '  + missing + ' is missing for Widget ' + type);
                }
            }

            this.__generate(type);

            return this;
        },
        /**
         * Gets a mixin by name or defines a new mixin for widgets.
         *
         * @memberOf uijet
         * @param {string} name - name of the mixin to get/define
         * @param {Object} [props] - properties defined by this mixin
         * @returns {uijet|Object}
         */
        Mixin                : function (name, props) {
            if ( arguments.length === 1 ) {
                if ( name in mixins ) {
                    return mixins[name];
                }
            }
            mixins[name] = props;
            return this;
        },
        /**
         * Gets an adapter by name or defines a new adapter for widgets.
         * If `props` is omitted and `name` is a:
         *
         * * `string`: Gets an adapter by this name
         * * `Object`: Defines a new adapter that will be added at the top of every widget and overrides everything else
         *
         * @memberOf uijet
         * @param {string|Object} name - a name of an existing or a new adapter or properties for a `TopAdapter` definition.
         * @param {Object} [props] - properties of the new adapter.
         * @returns {uijet|Object}
         */
        Adapter              : function (name, props) {
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
         * It's possible to nest factories by using a `factory` in the `declaration` instead of `type`.
         *
         * It's also possible to define a dynamic lazy factory as a `function` which
         * will take the `config` object as an argument and will return a qualified declaration object.
         *
         * @memberOf uijet
         * @param {string} name - identifier for this widget factory.
         * @param {Object|function} declaration - a viable object for {@see uijet.declare()} or a function that returns one.
         * @returns {uijet}
         */
        Factory              : function (name, declaration) {
            if ( isFunc(declaration) ) {
                widget_factories[name] = declaration;
            }
            else {
                widget_factories[name] = function (config) {
                    // create a copy of the original declaration
                    // make sure the original `config` object is copied
                    var declaration_copy;
                    if ( declaration.type ) {
                        declaration_copy = {
                            type  : declaration.type,
                            config: copy(true, declaration.config)
                        };
                    }
                    else {
                        var copy_of_dec_factory = widget_factories[declaration.factory](declaration.config);
                        declaration_copy = {
                            type  : copy_of_dec_factory.type,
                            config: copy(true, copy_of_dec_factory.config)
                        };
                    }
                    // mix in additional configurations
                    config && extend(true, declaration_copy.config, config);
                    return declaration_copy;
                };
            }
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
         * @memberOf uijet
         * @param {string} name - identifier for that resource class.
         * @param {Object} [resource] - this resource's constructor.
         * @param {boolean|Object|Array} [initial] - initial data for the generated instance or `true` to reset the registry of `name` to be instance `resource`.
         * @returns {uijet|Object}
         */
        Resource             : function (name, resource, initial) {
            if ( arguments.length === 1 ) {
                if ( name in resources ) {
                    return resources[name];
                }
            }
            if ( initial === true ) {
                resources[name] = resource;
            }
            else {
                resources[name] = uijet.newResource.apply(uijet, arraySlice.call(arguments, 1));
            }
            return this;
        },
        /**
         * Initializes and starts the uijet sandbox and all the declared widgets.
         * This also triggers the injection of all required modules.
         * Returns a promise for the initialization and waking process of the entire app,
         * unless disabled by the `dont_wake`/`dont_start` options.
         *
         * It's possible to catch any exception thrown from that process by setting a rejection
         * handler on the returned process.
         *
         * @memberOf uijet
         * @param {Object} [options] - configuration object for `uijet`.
         * @returns {Promise}
         *
         * #### uijet options:
         *
         * * `element`: {string|HTMLElement} the container element of the application. Defaults to `'body'`.
         * * `app_events`: {Object} a map of names of app events to subscribe to, to their handlers.
         * * `resources`: {Object} a map of names of resources to register, to their classes, or a tuple of the class and initial state.
         * * `dont_cover`: {boolean} whether to instruct the app's container to stretch across the entire viewport. Defaults to `false`.
         * * `dont_start`: {boolean} whether to call `uijet.startup()` and kick-start the UI. Defaults to `false`.
         * * `dont_wake`: {boolean} whether to call `wake()` on all top level widgets. Defaults to `false`.
         * * `pre_startup`: {function} optional hook for running logic before uijet starts up.
         * * `transition`: {string} default type of transition to be used across the app. Defaults to `'fade'`.
         * * `widgets`: {object[]} optional list of widget declarations.
         * * `route_prefix`: {string} optional prefix for routes to be used when creating those automatically from widget's IDs.
         * * `route_suffix`: {string} As above, only suffix.
         *
         * **Note**: The uijet app container element's `visibility` is initially set to `hidden`.
         * If you set `dont_start` to `true` you'll have eventually invoke `uijet.startup()` yourself or
         * set `uijet.$element[0].style.visibility` to `visible`.
         */
        init                 : function (options) {
            var task, q, _resources, _app_events, res, args, e;
                options = options || {};

            // if we have widgets defined
            if ( isArr(options.widgets) ) {
                // add these to the declared ones
                this.declare(options.widgets);
            }

            this.options = options;

            // set top container
            this.$element = this.$(this.options.element || 'body');
            this.$element.addClass('uijet_app');

            // unless requested by the user
            if ( ! this.options.dont_cover ) {
                // make the app container cover the entire viewport
                this.$element.addClass('cover');
            }

            uijet.debug = !! options.debug;

            if ( options.route_prefix ) {
                this.route_prefix = options.route_prefix;
            }
            if ( options.route_suffix ) {
                this.route_suffix = options.route_suffix;
            }

            // check if the app is using a router
            this.options.routed = isFunc(this.setRoute);

            // set default animation type
            this.options.transition = options.transition || 'fade';

            // check the init queue for deferred tasks
            if ( q = this.init_queue.length ) {
                while ( q -- ) {
                    task = this.init_queue[q];
                    // each task should be a `function` that takes a resolve and reject functions
                    if ( isFunc(task) ) {
                        // tasks' context is bound to uijet
                        // all tasks in queue are replaced by corresponding promises
                        this.init_queue[q] = uijet.Promise(task.bind(this));
                    }
                }
            }
            // no tasks in queue
            else {
                this.init_queue = [
                    {}
                ];
            }

            if ( _resources = options.resources ) {
                // register all resources
                // `resources` option is a map of resource registry name to its class
                for ( res in _resources ) {
                    args = _resources[res];
                    // a value in the `resources` option can also be an tuple of the class and initial state
                    if ( isArr(args) ) {
                        args.unshift(res);
                        this.Resource.apply(this, args);
                    }
                    else {
                        this.Resource(res, args);
                    }
                }
            }

            if ( _app_events = options.app_events ) {
                // subscribe to all events
                for ( e in _app_events ) {
                    this.subscribe(e, _app_events[e]);
                }
            }

            // after all tasks resolve
            return this.whenAll(this.init_queue)
                .then(function () {
                    // switch from declaring components to starting them
                    this.initializing = true;
                    // build and init declared widgets
                    // notice that here all modules are already loaded so this will run through
                    return this.start(declared_widgets);
                }.bind(this))
                .then(function () {
                    //when all declared widgets are initialized, set `uijet.initialized` to `true`
                    this.initialized = true;
                    // kick-start the GUI - unless ordered not to
                    return options.dont_start || this.startup();
                }.bind(this));
        },
        /**
         * Caches a definition of a widget in uijet.
         *
         * @memberOf uijet
         * @param {string} _name - identifier for the widget.
         * @param {Object} _props - the widget's prototype.
         * @param {Object} [_deps] - dependencies for this widget (widget and mixins).
         * @returns {uijet}
         * @private
         */
        __define             : function (_name, _props, _deps) {
            widget_definitions[_name] = {
                proto      : Create(_props),
                deps       : _deps,
                deps_merged: ! _deps
            };
            return this;
        },
        /**
         * Generates a widget class on top of {@see BaseWidget}.
         * Assumes all given dependencies (mixins and widget) are already loaded
         * and registered with `uijet`.
         *
         * @memberOf uijet
         * @param {string} type - this widget's type.
         * @param {string[]} [extra_mixins] - extra mixins to mix into the generated widget class.
         * @returns {function} class - the generated widget class.
         * @throws {Error} - missing widget/mixin dependency.
         * @private
         */
        __generate           : function (type, extra_mixins) {
            // create the base class
            var _class = this.BaseWidget,
                // get the cached definition
                def = widget_definitions[type],
                mixins_to_use = [],
                _mixin, m, complete_class_cache_key;

            if ( ! def ) {
                throw new Error('No definition found for: ' + type);
            }

            // see if the cached definition contains a merged list of dependency Mixins
            if ( def.deps ) {
                if ( def.deps.deps_merged ) {
                    mixins_to_use = def.deps.mixins;
                }
                else {
                    // merge Mixin dependencies
                    def.deps.mixins = mixins_to_use = _unique(_mergeMixinDeps(def.deps));
                    // mark it as merged
                    def.deps.deps_merged = true;
                }
            }
            else {
                mixins_to_use = [];
            }

            // check if we have ad-hoc mixins to add
            if ( extra_mixins && extra_mixins.length ) {
                mixins_to_use = _unique(mixins_to_use.concat(extra_mixins));
            }

            // create a cache key to store the complete prototype chain of Widgets and Mixins
            complete_class_cache_key = type + mixins_to_use.join('');

            // see if we already have a cached class with all Mixins mixed in
            if ( complete_class_cache_key in widget_mixedin_classes ) {
                _class = widget_mixedin_classes[complete_class_cache_key];
            }
            else {
                // otherwise
                // get the fully built Widget class for this type
                _class = _generateWidgetClass(type);

                // loop over all mixins needed to be mixed-in
                while ( m = mixins_to_use.shift() ) {
                    // if they're defined
                    if ( _mixin = mixins[m] ) {
                        // add them to the chain
                        // stack these madafakas
                        _class = Create(_mixin, _class);
                    }
                    else {
                        throw new Error('Missing mixin dependency: ' + m);
                    }
                }
                // cache the mixed-in class
                widget_mixedin_classes[complete_class_cache_key] = _class;
            }

            return _class;
        },
        /**
         * Performs all the work for {@see uijet.start()}.
         *
         * @memberOf uijet
         * @param {Object} widget - a widget declaration.
         * @returns {Promise} - a Promise object.
         * @private
         */
        __start              : function (widget) {
            var _factory = widget.factory,
                _w, l, _c, _adapters;
            // if this is a  cached factory declaration
            if ( _factory && widget_factories[_factory] ) {
                // use it to generate an instance's declaration
                widget = widget_factories[_factory](_config);
            }
            // generate (or get from cache) the mixed-in class
            _c = this.__generate(widget.type, widget.config.mixins);
            // create a new Widget instance from that class
            _w = new _c();
            // if we have adapters to use
            if ( _adapters = toArray(widget.config.adapters) ) {
                l = _adapters.length;
                // extend this instance with these adapters
                while ( l -- ) {
                    extendProto(_w, adapters[_adapters[l]]);
                }
            }
            // check for a top-adapter
            if ( adapters[TOP_ADAPTER_NAME] ) {
                // extend this instance with the top-adapter
                extendProto(_w, adapters[TOP_ADAPTER_NAME]);
            }
            // init the instance
            return _w.init(widget.config);
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
         * @memberOf uijet
         * @param {Object} widget - a widget's instance to register.
         * @returns {uijet}
         * @private
         */
        _register            : function (widget) {
            // get the parent element
            var _parent = null,
            // create the registry object
                _current = {
                    self     : widget,
                    contained: []
                },
                _id = widget.id,
                _body = _window.document.body,
                _parent_id, _container;
            // add registry object to the sandbox's store
            // if the registry exists
            if ( _id in widgets ) {
                // if there's an instance
                if ( widgets[_id].self ) {
                    if ( widgets[_id].self.options.destroy_duplicate ) {
                        // destroy!
                        widgets[_id].self.destroy();
                        // since desrtoy just unregistered this widget
                        widgets[_id] = _current;
                    }
                    else {
                        throw new Error('Got a duplicate widget for id: ' + _id);
                    }
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
                            contained: [_id]
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
                            contained: [_id]
                        };
                    }
                    _container = _parent_id;
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
                _container = '__app__';
                _current.container = _container;
            }
            widget.options.container = _container;
            return this;
        },
        /**
         * Removes a widget from the uijet sandbox registry.
         * This is usually triggered by a widget when its {@see BaseWidget.destroy()} method is called.
         *
         * @memberOf uijet
         * @param {Object} widget - a widget's instance to unregister.
         * @returns {uijet}
         * @private
         */
        _unregister          : function (widget) {
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
         * for lazy starting them at the end of its initialization,
         * or if uijet IS initialized, ad-hoc constructs and initializes
         * widget instance(s) from a given widget declaration(s).
         *
         * Returns a {@see Promise} that is resolved once all declared/started
         * instances finished initializing, or gets rejected if something fails.
         *
         * It's best to declare widgets in the order of their appearance
         * in the widgets tree (usually maps one-to-one to the DOM tree), so that
         * a widget is always declared before its contained widgets are declared, and so on.
         *
         * A declaration object usually contains `type` and `config` properties.
         * It may also contain a `factory` property, instead of the `type` one, if
         * this is an instance that's using a pre-declared widget factory.
         *
         * * `type`: a `String` that identifies a widget class created using `uijet.Widget(type, ...)`.
         * * `factory`: a `String` that identifies a widget factory created using `uijet.Factory(factory, ...)`.
         * * `config`: an `Object` that is used as the widget's `options`.
         *
         * **note**: For valid instance options see related module.
         *
         * **note**: If using the {@see Positioned} Mixin it's a must to
         * declare widgets in a specific order ( see {@see uijet._position()} ).
         *
         * @memberOf uijet
         * @param {Object|Object[]} declarations - a single declaration or a list of declaration objects.
         * @returns {Promise} promise - a promise that resolves when all started instances are initialized.
         * @throws {Error} - if `declarations` is neither an `Array` nor an `Object`.
         */
        declare              : uijet_declare_or_start,
        /**
         * An alias of {@see uijet.declare}.
         *
         * @memberOf uijet
         * @param {Object|Object[]} declarations - a single declaration or a list of declaration objects.
         * @returns {Promise} promise - a promise that resolves when all started instances are initialized.
         * @throws {Error} - if `declarations` is neither an `Array` nor an `Object`.
         */
        start                : uijet_declare_or_start,
        /**
         * Starts up uijet.
         * Publishes the `startup` event and wakes all widgets at the root of the widgets tree.
         * If the `pre_startup` callback is defined it will run in the beginning.
         *
         * **note**: If you are using a router module in your application,
         * then you may want to set uijet's `dont_wake` option to `true`,
         * so that the initial view is awaken by the router.
         *
         * @memberOf uijet
         * @returns {Promise}
         */
        startup              : function () {
            var pre_startup = this.options.pre_startup;
            // call `pre_startup`
            isFunc(pre_startup) && pre_startup();
            // listen to clicks around the app to notify about idle user interaction
            uijet.$element.on(uijet.support.click_events.full, function (e) {
                uijet.publish('app.clicked', e);
            });
            this.$element[0].style.visibility = 'visible';
            this.publish('startup');

            if ( ! this.options.dont_wake ) {
                // ☼ good morning sunshine ☼
                return uijet.whenAll(this._wakeContained(widgets.__app__));
            }

            return uijet.when(this);
        },
        /**
         * Publishes an app event with a passed deferred object containing `resolve` and `reject` methods,
         * and optionally `data`, and returns the promise that's affected by resolution of this deferred.
         *
         * This method is a mix of pub/sub and Promises that allows decoupled transfer of control from
         * one component to another.
         *
         * @see {@link https://gist.github.com/ydaniv/da5c55c41a5bffa897b1}
         * @memberOf uijet
         * @param {string} topic - a topic to publish.
         * @param {*} [data] - optional data to send with the published event.
         * @returns {Promise} - a promise that can be either resolved or rejected by a subscriber to `topic`.
         */
        shall                : function (topic, data) {
            return this.Promise(function (resolve, reject) {
                uijet.publish(topic, {
                    resolve: resolve,
                    reject : reject,
                    data   : data
                });
            });
        },
        /**
         * Wakes all of the contained child widgets of widget with matching `id`.
         * If `context` is supplied it is passed to each child widget's `wake()`.
         * Returns an array of promises, each returned from a child's `wake()`.
         *
         * @memberOf uijet
         * @param {Object} widget - the widget instance we want its children to wake.
         * @param {Object} [context] - context provided to the `wake()` call of this widget.
         * @returns {Promise[]} - promises returned from children's `wake()` call.
         * @private
         */
        _wakeContained       : function (widget, context) {
            var _contained = widgets[widget.id].contained,
                promises = [],
                _widget,
                l = _contained.length;
            while ( l -- ) {
                _widget = widgets[_contained[l]].self;
                if ( _widget && ! returnOf(_widget.options.dont_wake, _widget, context) ) {
                    promises.unshift(_widget.wake(context));
                }
            }
            return promises;
        },
        /**
         * Puts to sleep all of the contained child widgets of widget with matching `id`.
         *
         * @memberOf uijet
         * @param {Object} widget - the widget instance we want its children to call `sleep()`.
         * @returns {uijet}
         * @private
         */
        _sleepContained      : function (widget) {
            var _contained = widgets[widget.id].contained,
                l = _contained.length;
            while ( l -- ) {
                widgets[_contained[l]].self.sleep(true);
            }
            return this;
        },
        /**
         * Destroys all the contained child widgets of widget with matching `id`.
         *
         * @memberOf uijet
         * @param {Object} widget - the widget instance we want its children to call `destroy()`.
         * @returns {uijet}
         * @private
         */
        _destroyContained    : function (widget) {
            var args = arraySlice.call(arguments, 1),
                _contained, l, _w;
            // find `id`
            if ( widget.id in widgets ) {
                // get the ids of its contained child widgets
                _contained = widgets[widget.id].contained;
                l = _contained.length;
                while ( l -- ) {
                    // seek
                    if ( _contained[l] in widgets ) {
                        // and destroy
                        _w = widgets[_contained[l]].self;
                        _w.destroy.apply(_w, args);
                    }
                }
            }
            return this;
        },
        /**
         * Sets properties on the contained components of `widget`.
         * This effect will continue to propagate recursively.
         *
         * @memberOf uijet
         * @param widget - a widget instance which contained components will be retreived.
         * @param {Object} [context] - a map of properties to send to contained widgets to set on their `context`.
         * Defaults to the result of `widget.getContext()`.
         * @returns {uijet}
         * @private
         */
        _trickle             : function (widget, context) {
            var ctx = context || widget.getContext(),
                _contained = widgets[widget.id].contained,
                l = _contained.length,
                _w;
            while ( l -- ) {
                _w = widgets[_contained[l]].self;
                _w.setContext(ctx)
                  .trickle(ctx);
            }
            return this;
        }
    };

    /**
     * Set a namespace on uijet for utility functions.
     *
     * @namespace utils
     * @memberOf uijet
     */
    uijet.utils = {
        async           : async,
        extend          : extend,
        copy            : copy,
        extendProto     : extendProto,
        extendProxy     : extendProxy,
        Create          : Create,
        isObj           : isObj,
        isArr           : isArr,
        isFunc          : isFunc,
        toArray         : toArray,
        format          : format,
        returnOf        : returnOf,
        parseRestUrl    : parseRestUrl,
        toElement       : toElement,
        contains        : contains,
        getStyle        : getStyle,
        getStyleProperty: getStyleProperty,
        getOffsetOf     : getOffsetOf,
        /**
         * Makes sure a mixin's `name` is in the requested `position` of the
         * returned `array` of mixin names.
         *
         * Sometimes `array` could be an optional `mixins` option of some widget, in
         * which case the author of the widget's prototype expects to get `name`
         * wrapped in an `Array`.
         * There's also a chance `array` could be another mixin's name, in which case
         * it will be wrapped in an array and the operation is repeated.
         *
         * @memberOf uijet.utils
         * @param {string[]|string|undefined} array - The list of mixin names.
         * @param {string} name - The name of the mixin to add.
         * @param {number} [position]- The index in which to place `name` in `array` or simply at its end.
         * @returns {string[]} List of mixin names.
         */
        putMixin        : function putMixin (array, name, position) {
            var index;
            if ( ! array ) {
                // no mixins, so just return `name`
                return [name];
            }
            else if ( ! isArr(array) ) {
                // `array` is probably a `string` so wrap in an `array` and do it again
                return putMixin([array], name, position);
            }
            else {
                // position defaults to end of `array`
                position = typeof position == 'number' ? position : array.length;

                index = array.indexOf(name);
                if ( ~ index ) {
                    // if `name` is found in `array`
                    if ( index === position )
                    // if it's in the right position bail out
                    {
                        return array;
                    }
                    // it's not in the right position so remove it
                    array.splice(index, 1);
                }
                // put it where it should be
                array.splice(position, 0, name);
            }
            return array;
        },
        // wrap these objects since they point to native objects which is forbidden
        requestAnimFrame: function (f) {
            return requestAnimFrame(f);
        },
        cancelAnimFrame : function (id) {
            return cancelAnimFrame(id);
        }
    };

    // expose `Base`
    uijet.Base = Base;

    /*
     * Inject Pub/Sub, Promises, and DOM modules to uijet.
     */
    pubsub(uijet);
    promises(uijet);
    dom(uijet);

    return uijet;
}));
