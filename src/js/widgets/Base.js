// ### AMD wrapper
(function (root, factory) {
    // set the BaseWidget class with the returned constructor function
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery'], function (uijet, $) {
            return (uijet.BaseWidget = factory(uijet, $, root));
        });
    } else {
        root.uijet.BaseWidget = factory(root.uijet, root.jQuery, root);
    }
}(this, function (uijet, $, _window) {
    var Object = _window.Object,
        // cache the utilities namespace
        Utils = uijet.Utils,
        // constructor for BaseWidget
        Widget = function () {},
        arraySlice = _window.Array.prototype.slice,
        CONFIG_ATTR = 'data-uijet-config',
        TYPE_ATTR = 'data-uijet-type',
        SUBSTITUTE_REGEX = /\{([^\s\}]+)\}/g;

    // shim for Object.keys
    if ( typeof Object.keys != 'function' ) {
        Object.keys = (function () {
            var hasOwnProperty = Object.prototype.hasOwnProperty,
                hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
                dontEnums = [
                    'toString',
                    'toLocaleString',
                    'valueOf',
                    'hasOwnProperty',
                    'isPrototypeOf',
                    'propertyIsEnumerable',
                    'constructor'
                ],
                dontEnumsLength = dontEnums.length;

            return function (obj) {
                if ( typeof obj !== 'object' && typeof obj !== 'function' || obj === null)
                    throw new TypeError('Object.keys called on non-object');
                var result = [];
                for ( var prop in obj )
                    if ( hasOwnProperty.call(obj, prop) )
                        result.push(prop);
                if ( hasDontEnumBug )
                    for (var i = 0 ; i < dontEnumsLength ; i++ )
                        if ( hasOwnProperty.call(obj, dontEnums[i]) )
                            result.push(dontEnums[i]);
                return result;
            };
        })();
    }

    Widget.prototype = {
        constructor     : Widget,
        // ### widget.init
        // @sign: init(options)  
        // @return: this
        //
        // *Lifecycle method*
        // Initializes a widget instance. Attempts to do all the lifting that can be done prior to
        // any data received or templates fetched.  
        // Takes an `options` `Object` as argument.  
        // For now this options is mandatory, mainly because it must contain the `element` option.
        init            : function (options) {
            this.signals_cache = {};
            this.signals = Object.create(this.signals_cache);
            this.setOptions(options)
                // set .id
                .setId()
                // set .$element
                .setElement()
                // hide the element to prevent browser rendering as much as possible
                ._setCloak(true)
                // parse the rest of the options, like events handling, etc.
                .setInitOptions()
                // wrapping, styling, positioning, etc.
                .prepareElement()
                // if there's sandbox registry any required
                .register()
                // cache reference to initial markup that was coded into the element by user
                ._saveOriginal();
            this.notify('post_init');
            return this;
        },
        // ### widget.register
        // @sign: register()  
        // @return: this
        //
        // Registers the widget into the sandbox.  
        // Hooks into uijet's `registerWidget`.
        // *Note*: It is recommended to call `this._super` first thing when overriding this method.
        register        : function () {
            uijet.registerWidget(this);
            return this;
        },
        // ### widget.wake
        // @sign: wake([context[, more_context[, ...]]])  
        // @return: this
        //
        // *Lifecycle method*
        // Starts the widget up.  
        // This is the core action that gets all the data and performs all renderings.  
        // May take an unlimited number of optional arguments which may serve as the data context
        // for this instance to start itself with.
        wake            : function (context) {
            var that = this,
                dfrds, success, _sequence;
            // if already awake and there's no new data coming in then no reason to continue
            if ( this.awake && ! context ) return this._finally();
            // prepare a pre_wake signal
            // fire pre_wake signal
            this.notify('pre_wake', context);
            // set the the context data if any
            this._setContext(context);
            // the rest of the tasks needed to be performed
            success = function () {
                // there was context to change but if we're set then bail out
                if ( ! that.awake ) {
                    that.render()
                        // bind DOM events
                        .bind()
                        .appear()
                        .awake = true;
                }
                that.notify('post_wake');
                that._finally();
            };
            // wake up all contained widgets
            dfrds = this.wakeContained(context);
            // register a failure callback in case one of the children failed to wake up
            _sequence = $.when.apply($, dfrds).fail(function () {
                that.notify('wake_failed', arguments);
                that.sleep();
            });
            // if this widget is to be wake up in sync with its children then let it call
            // success once they're done
            // otherwise call success
            this.options.sync ? _sequence.done(success) : success();
            return this;
        },
        // ### widget.wakeContained
        // @sign: wakeContained([context])  
        // @return: uijet.wakeContained(...)
        //
        // *Lifecycle method*
        // Wakes up contained widgets.  
        // Hooks up into `uijet.wakeContained`.  
        // Takes an optional `context` argument (usually an `Object`).  
        // Returns the result of the call to `uijet.wakeContained`, which returns an `Array` of the promises
        // of all deferred objects created by each contained widget's `wake` call.  
        // This array is then handed into the deferring of this widget's `wake` call to check whether a child
        // failed to wake or to halt until all are awake in case of a `sync`=`true`.
        wakeContained   : function (context) {
            // returns an array of jQuery deferreds
            return uijet.wakeContained(this.id, context);
        },
        // ### widget.sleep
        // @sign: sleep([no_transitions])  
        // @return: this
        //
        // *Lifecycle method*
        // Stops a started widget.  
        // This is the opposite of `wake`. Does only what it takes for this widget to not appear
        // and stay as much out of the way as needed (unbind, events, turn invisible, etc.).  
        // Takes an optional flag argument which if `true` tells `disappear` not to perform animations.
        sleep           : function (no_transitions) {
            // continue only if we're awake
            if ( this.awake ) {
                this.notify('pre_sleep');
                // unbind DOM events
                this.unbind()
                    // hide
                    .disappear(no_transitions)
                    // stop contained widgets
                    .sleepContained()
                    .awake = false;
                // perform destroy if asked to
                this.options.destroy_on_sleep && this.destroy();
                this.notify('post_sleep');
            }
            return this._finally();
        },
        // ### widget.sleepContained
        // @sign: sleepContained()  
        // @return: this
        //
        // Stop all contained widgets.  
        // Hooks up into `uijet.sleepContained`.
        sleepContained  : function () {
            uijet.sleepContained(this.id);
            return this;
        },
        // ### widget.destroy
        // @sign: destroy()  
        // @return: this
        //
        // *Lifecycle method*
        // Clean up all related data, DOM and memory related to this instance.  
        // This method is not called by default.
        destroy         : function () {
            this.notify('pre_destroy');
            // perform a recursive destruction down the widget tree
            this.destroyContained();
            // unsubscribe to app events
            this.options.app_events && this.unsubscribe(_window.Object.keys(this.options.app_events).join(' '));
            // remove DOM elements
            this.remove()
                ._finally();
            return this;
        },
        // ### widget.destroyContained
        // @sign: destroyContained()  
        // @return: this
        //
        // Cleans up all contained widgets.  
        // Hooks up into `uijet.destroyContained`.
        destroyContained: function () {
            uijet.destroyContained(this.id);
            return this;
        },
        // ### widget.update
        // @sign: update()  
        // @return: deferred_update.promise()
        //
        // Loads the widget's data from the server and returns a promise that's resolved OR rejected
        // depending on success of that action.
        // It gets the URL using `getDataUrl` and on success runs `setData`.
        // If that succeeds then `has_data` is set to `true` and flow continues towards resolve.
        // In case of any failure or if `data` wasn't correct and wasn't set the promise is rejected.
        // If the XHR failed then the `update_error` event is fired and, unless aborted, the promise is rejected.
        update          : function () {
            var dfrd_update, _success;
            // if there's no URL set bail
            if ( ! this.options.data_url ) return {};
            // since this may take more then a few miliseconds then publish the `pre_load` event to allow the UI
            // to respond to tasks that require a long wait from the user
            this.publish('pre_load', null, true);
            // our update promise object
            dfrd_update = $.Deferred();
            _success = function (response) {
                // set `this.data`
                this.setData(response);
                if ( ! this.has_data ) {
                    // if `setData` failed, reject the promise
                    dfrd_update.reject(response);
                } else {
                    // if success notify a signal that we have `data` and resolve the promise
                    this.notify('post_fetch_data', response);
                    dfrd_update.resolve();
                }
            };
            // send XHR to update
            $.ajax(this.getDataUrl(), {
                type    : 'get',
                dataType: 'json',
                context : this
            }).done(_success)
            .fail(function (response) {
                // notify there was an error and allow user to continue with either:
                //
                // * __success flow__: success callback is sent as the last argument to the signal's handler
                // * __failrue flow__: in case anything but `false` is returned from `update_error` handler
                // * __or abort it all__: return `false` from `update_error` handler
                var _abort_fail = this.notify.apply(this, ['update_error'].concat(arraySlice.call(arguments), _success.bind(this)));
                if ( _abort_fail !== false ) {
                    // publish an error has occurred with `update`
                    this.publish('update_error', response, true);
                    dfrd_update.reject(response);
                }
            });
            return dfrd_update.promise();
        },
        // ### widget.prepareElement
        // @sign: prepareElement()  
        // @return: this
        //
        // Prepares the instance's element by setting attributes and styles.  
        // In its basic format adds classes and calls `setStyle` and `position`.  
        // This is usually called once in the init sequence.
        prepareElement  : function () {
            this.$element.addClass('uijet_widget ' + this.options.type_class);
            this.setStyle()
                .position();
            return this;
        },
        // ### widget.setStyle
        // @sign: setStyle()  
        // @return: this
        //
        // Sets the instance element's style in case the `style` option is set.  
        // It makes sure the the element is wrapped first and sets those style properties on the `$wrapper`.  
        // It uses `jQuery.css` on the element with the option's value.  
        // This is usually called once in the init sequence.
        setStyle        : function () {
            var _style = this.options.style;
            if ( _style ) {
                if ( Utils.isFunc(_style) ) {
                    _style = Utils.returnOf(_style, this);
                }
                this._wrap()
                    .$wrapper.css(_style);
            }
            return this;
        },
        // # -NOT IMPLEMENTED-
        // ### widget.generate
        // @sign: generate()  
        // @return: html
        //
        // A hook to the template engine, used by uijet, to render the template and return the HTML.
        generate        : function () {
            throw new Error('generate not implemented');
        },
        // ### widget.render
        // @sign: render()  
        // @return: this
        //
        // Renders the instance.  
        // In its base form this it's just a placeholder.
        render          : function () {
            this.notify('pre_render');
            return this;
        },
        // ### widget.position
        // @sign: position()  
        // @return: this
        //
        // Positions the instance's element if the `position` option is set.  
        // Makes sure the element is wrapped first.  
        // If this option is set then the 'fixed' class is added to the `$wrapper`.
        // Then, if it's a `String` it is added as a class too.  
        // If ='center' then `_center` is called as well.  
        // If it's an `Object` then it's used as argument for a `jQuery.css` call on the `$wrapper`.  
        // This is usually called once in the init sequence, then the option is deleted
        // to prevent unnecessary repeating of this call.
        position        : function () {
            var _pos = this.options.position;
            if ( _pos ) {
                this._wrap()
                    .$wrapper.addClass('fixed');
                if ( typeof _pos == 'string') {
                    this.$wrapper.addClass( _pos);
                    if ( _pos == 'center') {
                        this._center();
                    }
                } else if ( Utils.isObj(_pos) ) {
                    this.$wrapper.css(_pos);
                }
                // no need to position twice
                delete this.options.position;
            }
            return this;
        },
        // ### widget.appear
        // @sign: appear()  
        // @return: this
        //
        // Makes the instance's element appear (initially `visibility` is set to `hidden`).
        appear          : function () {
            this.notify('pre_appear');
            this._setCloak(false)
                .notify('post_appear');
            return this;
        },
        // ### widget.disappear
        // @sign: disappear()  
        // @return: this
        //
        // Makes the instance's element disappear, basically setting `visibility` to `hidden`.
        disappear       : function () {
            this._setCloak(true)
                .notify('post_disappear');
            return this;
        },
        // ### widget.bind
        // @sign: bind()  
        // @return: this
        //
        // Binds DOM events related to the instance's element, based on the `dom_events` option.  
        // At the end sets the `bound` flag to `true`.  
        // This is called every time the widget is awaken.  
        //TODO: rewrite as a method that binds one event and move this implementation under a different name
        bind            : function () {
            var _dom_events, e, that = this, _bound;
            if ( _dom_events = this.options.dom_events ) {
                this._bound_dom_events = _bound = {};
                for ( e in _dom_events ) (function (name, handler) {
                    _bound[name] = handler.bind(that);
                    that.$element.bind(name, _bound[name]);
                })(e, _dom_events[e]);
            }
            this.bound = true;
            return this;
        },
        // ### widget.unbind
        // @sign: unbind()  
        // @return: this
        //
        // Unbinds all DOM events related to the instance's element, based on the `dom_events` option.  
        // At the end sets the `bound` flag to `false`.  
        // This is usually called every time the widget is put to sleep.  
        //TODO: rewrite as a method that unbinds one event and move this implementation under a different name
        unbind          : function () {
            var _dom_events;
            if ( _dom_events = this.options.dom_events ) {
                this.$element.unbind(this._bound_dom_events);
            }
            this.bound = false;
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
            // add this event to the `app_events` option to allow quick unsubscribing later
            this.options.app_events[topic] = handler;
            uijet.subscribe(topic, handler.bind(this));
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
        // ### widget.runRoute
        // @sign: runRoute(route, [is_silent])  
        // @return: this
        //
        // Runs a route.  
        // If `is_silent` is supplied and is `true` this route will not propagate to the browser's address bar
        // and will only trigger the callback for that route.  
        // It's a hook into `uijet.runRoute`.
        runRoute        : function (route, is_silent) {
            uijet.runRoute(route, is_silent);
            return this;
        },
        // ### widget.select
        // @sign: select(initial)  
        // @return: this
        //
        // Triggers a selection in the widget's UI, according to implementation.  
        // In its base form only triggers the `click` event.  
        // If `initial` is a `function` then the result of its call is the element to call `click` on..  
        // Otherwise (usually a `String`) find this element inside `this.$element` using `initial` as selector
        // and perform the click on the result.
        select          : function (initial) {
            var $el;
            $el = typeof initial == 'function' ? initial.call(this) : this.$element.find(initial);
            typeof $el.click == 'function' && $el.click();
            return this;
        },
        // ### widget.setInnerRouter
        // @sign: setInnerRouter()  
        // @return: this
        //
        // Transforms `this.$element` to a gateway for routes by delegating all anchor clicks inside it
        // to `uijet.runRoute`.  
        // The 'is_silent' param is determined by the `routing` option:  
        // If routing is `undefined` then it's `true`.  
        // If it's a `function` then it is its call's result when the clicked anchor is handed to it.  
        // Otherwise it is simply the opposite of the truthiness of `routing`.  
        // This is usually called once in the init sequence.
        setInnerRouter  : function () {
            var routing = this.options.routing, that = this;
            //TODO: switch to $element.on('click', 'a', function ...)
            this.$element.delegate('a, [data-uijet-route]', 'click', function (e) {
                var $this = $(this),
                    is_anchor = this.tagName.toLowerCase() == 'a',
                    _route = $this.attr(is_anchor ? 'href' : 'data-uijet-route');
                that.runRoute(_route, typeof routing == 'undefined' ? true : typeof routing == 'function' ? ! routing.call(that, $this) : ! routing);
                // confine the event here since it might break other handlers
                e.stopPropagation();
                // prevent because this is an INNER router
                is_anchor && e.preventDefault();
            });
            return this;
        },
        // ### widget.setOptions
        // @sign: setOptions([options])  
        // @return: this
        //
        // Set this instance's options.  
        // This is usually called once in the init sequence.
        setOptions      : function (options) {
            this.options = Utils.extend(true, {}, this.options, options);
            return this;
        },
        // ### widget.setInitOptions
        // @sign: setInitOptions()  
        // @return: this
        //
        // Perform initialization related tasks on this instance based on the options set.
        // This method is usually called once inside the `init` method flow, after `setOptions`.
        setInitOptions  : function () {
            var ops = this.options,
                _app_events = ops.app_events || {},
                _signals;
            // listen to all signals set in options
            if ( _signals = ops.signals ) {
                for ( var n in _signals ) {
                    this.listen(n, _signals[n]);
                }
            }
            // if `wake_on_start` is set to `true` then register a wake handler to sandbox's `startup` event
            if ( ops.wake_on_startup ) {
                // making sure this option exists
                ops.app_events = _app_events;
                _app_events.startup = function () { this.wake(); };
            }
            // subscribe to all app (custom) events set in options
            if ( ops.app_events ) {
                for ( n in _app_events ) {
                    this.subscribe(n, _app_events[n]);
                }
            }
            // capture and delegate all anchor clicks to an inner routing mechanism
            if ( ~ 'function boolean undefined'.indexOf(typeof ops.routing) && ops.routing !== false ) {
                this.setInnerRouter();
            }
            return this;
        },
        // ### widget.setId
        // @sign: setId()  
        // @return: this
        //
        // Sets the instance's `id` using the one set in the config OR the instance's `$element`'s OR
        // tries to create that `$element` and get its `id`.  
        // This is usually called once in the init sequence.  
        //TODO: allow the automatic setting of a unique ID
        setId           : function () {
            this.id = this.options.id || (this.$element && this.$element[0].id) || this.setElement().$element[0].id;
            return this;
        },
        // ### widget.setElement
        // @sign: setElement([element])  
        // @return: this
        //
        // set the instance's `$element` either by getting it as a param OR from `element` option.  
        // This is usually called once in the init sequence.  
        //TODO: allow the creation of the element outside the `document` when it doesn't exist in the DOM
        setElement      : function (element) {
            if ( ! this.$element ) {
                // use the `element` argument or the option.
                element = element || this.options.element;
                // if it's not a jQuery object then wrap it
                this.$element = element.jquery ? element : $(element);
            }
            return this;
        },
        // ### widget.getDataUrl
        // @sign: getDataUrl()  
        // @return: data_url
        //
        // Gets the URL used by the widget to fetch/send data.  
        // Uses the instance's context object to replace params in the URL's pattern.
        getDataUrl      : function () {
            return this.substitute(uijet.Utils.returnOf(this.options.data_url, this), this.context);
        },
        // ### widget.substitute
        // @sign: substitute(template, obj)  
        // @return: String
        //
        // Does a simple string replace on the template using `obj` as the map of
        // params to values.  
        // This method is used in `getDataUrl`.
        substitute      : function(template, obj) {
            var n = 0;
            return template.replace(SUBSTITUTE_REGEX, function(match, key){
                return Utils.isObj(obj) ? obj[key] : obj[n++];
            });
        },
        // ### widget.setData
        // @sign: setData(data)  
        // @return: this
        //
        // Sets the instance's `data` with the given `data` argument.  
        // Before the data is set it emits the `process_data` signal.  
        // If that signal's callback returns a defined falsy value then `data` isn't set.  
        // If `data` __was__ set it sets the `has_data` of this instance to `true`.  
        // This is important for `update` to know that it succeeded.
        setData         : function (data) {
            // notify the `process_data` signal
            var success = this.notify('process_data', data);
            // if `success` is returned and falsy then bail out
            if ( typeof success != 'undefined' && ! success ) {
                return this;
            }
            // set data
            this.data = data;
            this.has_data = true;
            return this;
        },
        // ### widget.unshadow
        // @sign: unshadow(elements, [do_unshadow])  
        // @return: this
        //
        // Used in platforms where CSS shadows creates big performance issues.  
        // Removes CSS box-shadows from the specified `elements` which is either HTML elements or a selector,
        // passed to jQuery.  
        // If `do_ushadow` is a boolean it's used for toggeling the state. 
        // Currently only used on iPad.  
        // Internally this toggles the `unshadow` class.
        unshadow        : function (elements, do_unshadow) {
            uijet.is_iPad && $(elements).toggleClass('unshadow', typeof do_unshadow == 'boolean' ? do_unshadow : true);
            return this;
        },
        // ### widget.remove
        // @sign: remove()  
        // @return: this
        //
        // Removes the instance's element, and wrapper if exists, from the DOM.  
        // This is usually used inside destroy sequence.  
        //TODO: write a method that gets the top level element
        remove          : function () {
            (this.$wrapper || this.$center_wrapper || this.$element).remove();
            return this;
        },
        // ### widget._wrap
        // @sign: _wrap()  
        // @return: this
        //
        // Wraps the instance's `$element` with `<div>` element.
        // This wrapper has the `class` of the original `type_class` prefixed with __uijet_wrapper__, and
        // the same `id` suffixed with ___wrapper__.  
        // At the end sets a reference to this element in `$wrapper`.  
        // If `$wrapper` is already set, skips to return.
        _wrap           : function () {
            if ( ! this.$wrapper ) {
                // wrap and cache the wrapper
                this.$wrapper = this.$element.wrap($('<div/>', {
                    'class' : 'uijet_wrapper ' + this.options.type_class + '_wrapper',
                    id      : this.id + '_wrapper'
                })).parent();
            }
            return this;
        },
        // ### widget._center
        // @sign: _center()  
        // @return: this
        //
        // Centers the instance's `$element` by wrapping it with a `<div>` element that has a `class`
        // of the original `type_class` suffixed with ___center_wrapper__.  
        // At the end sets a reference to this element in `$center_wrapper`.  
        // If `$center_wrapper` is already set, skips to return.
        _center         : function () {
            if ( ! this.$center_wrapper ) {
                // wrap and cache the wrapper
                this.$center_wrapper = this.$element.wrap($('<div/>', {
                    'class' : 'uijet_center_wrapper ' + this.options.type_class + '_center_wrapper'
                })).parent();
            }
            return this;
        },
        // ### widget._getSize
        // @sign: _getSize()  
        // @return: {width: <width>, height: <height>}
        //
        // Gets the size of _content_ of `$element`, meaning, if it's `horizontal` then count
        // the width of its children.  
        // If it's not then find where its last contained element's bottom is at.  
        // The other left dimensions in those cases are determined by the corresponding dimension of the first child.  
        // Returns an `Object` with `width` and `height` properties.
        _getSize        : function () {
            var $children = this.$element.children(),
                last_child = $children.get(-1),
                size = { width: 0, height: 0 },
                // since the default overflow of content is downward just get the last child's position + height
                total_height = last_child.offsetTop + last_child.offsetHeight,
                total_width = 0,
                l = $children.length;
            if ( this.options.horizontal ) {
                // since HTML is finite horizontally we *have* to count all children
                $children.each(function (i, child) {
                    total_width += child.offsetWidth;
                });
                size.width = total_width;
                size.height = $children[0].offsetHeight;
            } else {
                size.width = $children[0].offsetWidth;
                size.height = total_height;
            }
            return size;
        },
        // ### widget._setCloak
        // @sign: _setCloak(cloak)  
        // @return: this
        //
        // Depending on the `cloak` flag either sets the `$element`'s `visibility` to `hidden` or `visible`.
        _setCloak       : function (cloak) {
            this.$element[0].style.visibility = cloak ? 'hidden' : 'visible';
            return this;
        },
        // ### widget._setContext
        // @sign: _setContext(context)  
        // @return: this
        //
        // If it gets a `context` object it sets it to `this.context`,  
        _setContext     : function (context) {
            if ( context ) {
                this.context = context;
            }
            return this;
        },
        // ### widget._saveOriginal
        // @sign: _saveOriginal()  
        // @return: this
        //
        // Sets `this.$original_children` with the `$element`'s children as a jQuery object if they aren't set yet.  
        // This is used to save reference to elements created by the user in the original markup, prior to rendering.
        _saveOriginal   : function () {
            // save a reference to the child nodes of the element prior to rendering
            ! this.$original_children && (this.$original_children = this.$element.children());
            return this;
        },
        // ### widget._clearRendered
        // @sign: _clearRendered()  
        // @return: this
        //
        // Removes the elements created by rendering the widget, meaning all that's *NOT* in `$original_children`.  
        // Also cleares the `style` attribute of `$element`.  
        // At the end resets `has_content` to `false`.
        _clearRendered  : function () {
            if ( this.bound ) {
                this.unbind();
            }
            // remove all children that were added with .render()
            this.$element.children().not(this.$original_children).remove();
            // needed to work around a Webkit bug
            this.$element[0].setAttribute('style', '');
            this.$element[0].removeAttribute('style');
            this.has_content = false;
            return this;
        },
        // ### widget._finally
        // @sign: _finally()  
        // @return: this
        //
        // A utility method that's called at the end of every *lifecycle method* call.  
        // Does all the clean up related a lifecycle operation, such as clearing the callable signals hash and
        // setting current `options.state`.
        _finally        : function () {
            // replace the masking `Object` with a new one
            this.signals = Object.create(this.signals_cache);
            this.options.state = this.awake ? 'current' : 'asleep';
            return this;
        }
    };

    return Widget;
}));