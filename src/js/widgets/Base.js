(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery'], function (uijet, $) {
            return (uijet.BaseWidget = factory(uijet, $, root));
        });
    } else {
        root.uijet.BaseWidget = factory(root.uijet, root.jQuery, root);
    }
}(this, function (uijet, $, _window) {
    var Object = _window.Object,
        Utils = uijet.Utils, // cache the utilities namespace
        Widget = function () {}, // constructor for BaseWidget
        arraySlice = _window.Array.prototype.slice,
        CONFIG_ATTR = 'data-uijet-config',
        TYPE_ATTR = 'data-uijet-type',
        SUBSTITUTE_REGEX = /\{([^\s\}]+)\}/g;

    Widget.prototype = {
        constructor     : Widget,
        /*
         * @sign: init(options)
         * @return: this
         *
         * Initializes a widget instance. Attempts to do all the lifting that can be done prior to
         * any data received or templates fetched.
         * Takes an options object as argument.
         * For now this options is mandatory, mainly because it must contain the element option.
         */
        init            : function (options) {
            this.signals_cache = {};
            this.signals = Object.create(this.signals_cache);
            this.setOptions(options)
                .setId()            // set .id
                .setElement()       // set .$element
                ._setCloak(true)    // hide the element to prevent browser rendering as much as possible
                .prepareElement()   // wrapping, styling, positioning, etc.
                .setInitOptions()   // parse the rest of the options, like event handling, etc.
                .register()         // if there's sandbox registry any required
                ._saveOriginal();   // cache reference to initial markup that was coded into the element by user
            this.notify('post_init');
            return this;
        },
        /*
         * @sign: register()
         * @return: this
         *
         * Abstract method that may be used by concrete widgets to register themselves into special
         * namespaces in the uijet sandbox, such as Views and Forms, etc.
         */
        register        : function () {
            return this;
        },
        /*
         * @sign: wake([context[, more_context[, ...]]])
         * @return: this
         *
         * Starts the widget up.
         * This is the core action that gets all the data and performs all renderings.
         * May take an unlimited number of optional arguments which may serve as the data context
         * for this instance to start itself with.
         */
        wake            : function (context) {
            var that = this,
                dfrds, args, success, _sequence;
            // if already awake and there's no new data coming in
            if ( this.awake && ! context ) return this._finally(); // no reason to continue
            // prepare a pre_wake signal
            args = ['pre_wake'].concat(arraySlice.call(arguments));
            // fire pre_wake signal
            this.notify.apply(this, args);
            // set the the context data if any
            this._setContext.apply(this, arguments);
            // the rest of the tasks needed to be performed
            success = function () {
                if ( ! that.awake ) { // there was context to change but if we're set then bail out
                    that.render()
                        .bind()     // DOM events
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
        /*
         * @sign: wakeContained([context])
         * @return: uijet.wakeContained(...)
         *
         * Wakes up contained widgets.
         * Hooks up into the sandbox's wakeContained method.
         * Takes an optional context argument (usually an object).
         * Returns the result of the call to uijet.wakeContained, which returns an array of the promises
         * of all deferred objects created by each contained widget's wake call.
         * This array is then handed into the deferring of this widget's wake call to check whether a child
         * failed to wake or to halt until all are awake in case of a sync=true.
         */
        wakeContained   : function (context) {
            return uijet.wakeContained(this.id, context); // returns an array of jQuery deferreds
        },
        /*
         * @sign: sleep([no_transitions])
         * @return: this
         *
         * Stops a started widget.
         * This is the opposite of wake. Does only what it takes for this widget to not appear
         * and stay as much out of the way as needed.
         * Takes an optional flag argument which if true tells disappear not to perform animations.
         */
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
        /*
         * @sign: sleepContained()
         * @return: this
         *
         * Stop all contained widgets.
         * Hooks up into the sandbox's sleepContained method.
         */
        sleepContained  : function () {
            uijet.sleepContained(this.id);
            return this;
        },
        /*
         * @sign: destroy()
         * @return: this
         *
         * Clean up all related data, DOM and memory related to this instance.
         * This method is usually not called by default.
         */
        destroy         : function () {
            this.notify('pre_destroy');
            // perform a recursive destruction down the widget tree
            this.destroyContained()
                // unsubscribe to app events
                .unsubscribe(_window.Object.keys(this.options.app_events).join(' '))
                .remove() // remove DOM elements
                ._finally();
            return this;
        },
        /*
         * @sign: destroyContained()
         * @return: this
         *
         * Cleans up all contained widgets.
         * Hooks up into the sandbox's destroyContained method.
         */
        destroyContained: function () {
            uijet.destroyContained(this.id);
            return this;
        },
        /*
         * @sign: update()
         * @return: deferred_update.promise()
         *
         * Loads the widget's data from the server and returns a promise that's resolved OR rejected
         * depending on success of that action.
         * It gets the URL using .getDataUrl and on success runs the .setData.
         * If that succeeds then .has_data is set to `true` and flow continues toward resolve.
         * In case of any failure the, if data wasn't correct and wasn't set the promise is rejected.
         * If the XHR failed then the 'update_error' event is fired and, unless aborted, the promise is rejected.
         */
        update          : function () {
            var dfrd_update, _success;
            if ( ! this.options.data_url ) return {};
            this.publish('pre_load', null, true);
            dfrd_update = $.Deferred();
            _success = function (response) {
                this.setData(response);
                if ( ! this.has_data ) {
                    dfrd_update.reject(response);
                } else {
                    this.notify('post_fetch_data', response);
                    dfrd_update.resolve();
                }
            };
            $.ajax(this.getDataUrl(), {
                type    : 'get',
                dataType: 'json',
                context : this
            }).done(_success)
            .fail(function (response) {
                var _abort_fail = this.notify.apply(this, ['update_error'].concat(arraySlice.call(arguments), _success.bind(this)));
                if ( _abort_fail !== false ) {
                    this.publish('update_error', response, true);
                    dfrd_update.reject(response);
                }
            });
            return dfrd_update.promise();
        },
        /*
         * @sign: prepareElement()
         * @return: this
         *
         * Prepares the instance's element by setting attributes and styles.
         * In its basic format adds classes and calls .setStyle and .position.
         * This is usually called once in the init sequence.
         */
        prepareElement  : function () {
            this.$element.addClass('uijet_widget ' + this.options.type_class);
            this.setStyle()
                .position();
            return this;
        },
        /*
         * @sign: setStyle()
         * @return: this
         *
         * Sets the instance element's style in case the style option is set.
         * It makes sure the the element is wrapped first and sets those style properties on the $wrapper.
         * This is usually called once in the init sequence.
         */
        setStyle        : function () {
            var _style = this.options.style;
            if ( _style ) {
                this._wrap()
                    .$wrapper.css(_style);
            }
            return this;
        },
        /*
         * @sign: generate()
         * @return: html
         *
         * Sets the instance element's style in case the style option is set.
         * It makes sure the the element is wrapped first and sets those style properties on the $wrapper.
         * This is usually called once in the init sequence.
         */
        generate        : function () {
            throw new Error('generate not implemented');
        },
        /*
         * @sign: render()
         * @return: this
         *
         * Renders the instance.
         * In its base form this is just a placeholder.
         */
        render          : function () {
            this.notify('pre_render');
            return this;
        },
        /*
         * @sign: position()
         * @return: this
         *
         * Positions the instance's element if the position option is set.
         * Makes sure the element is wrapped first.
         * This is usually called once in the init sequence, then the option is deleted
         * to prevent unnecessary repeating of this call.
         */
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
                delete this.options.position; // no need to position twice
            }
            return this;
        },
        /*
         * @sign: appear()
         * @return: this
         *
         * Makes the instance's element appear (initially visibility is set to hidden).
         */
        appear          : function () {
            this._setCloak(false)
                .notify('post_appear');
            return this;
        },
        /*
         * @sign: disappear()
         * @return: this
         *
         * Makes the instance's element disappear, basically setting visibility to hidden.
         */
        disappear       : function () {
            this._setCloak(true)
                .notify('post_disappear');
            return this;
        },
        /*
         * @sign: bind()
         * @return: this
         *
         * Binds DOM events related to the instance's element, based on the dom_events option.
         * This is usually called once in the init sequence.
         */
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
        /*
         * @sign: unbind()
         * @return: this
         *
         * Unbinds all DOM events related to the instance's element, based on the dom_events option.
         * This is usually called once in the destroy sequence.
         */
        unbind          : function () {
            var _dom_events;
            if ( _dom_events = this.options.dom_events ) {
                this.$element.unbind(this._bound_dom_events);
            }
            this.bound = false;
            return this;
        },
        /*
         * @sign: listen(topic, handler)
         * @return: this
         *
         * Sets a handler function on the given signal with `topic` as its type.
         */
        listen          : function (topic, handler) {
            this.signals_cache[topic] = handler;
            return this;
        },
        /*
         * @sign: unlisten(topic)
         * @return: this
         *
         * Removes a handler from the given signal with `topic` as its type.
         */
        unlisten        : function (topic) {
            if ( this.signals_cache[topic] ) {
                delete this.signals[topic];
                delete this.signals_cache[topic];
            }
            return this;
        },
        /*
         * @sign: notify(topic [, args]) OR notify(persist, topic [, args])
         * @return: handler() OR undefined
         *
         * Triggers a signal handler using 'topic' as its type, and returns the result of that call.
         * If the first argument supplied to notify is a boolean it is used to determine whether
         * multiple calls can be made to this type in during the same single call to a lifecycle method.
         * All subsequent arguments are sent to the handler as parameters.
         * If the topic isn't found or it has fired and not set as persistent, then nothing happens
         * and `undefined` is returned.
         */
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
        /*
         * @sign: subscribe(topic, handler)
         * @return: this
         *
         * Subscribes a handler to a custom event with `topic` as type.
         * It's a hook into the sandbox's subscribe method only the handler is bound to `this`.
         */
        subscribe       : function (topic, handler) {
            if ( ! (topic in this.options.app_events) ) {
                // add this event to the app_events option to allow quick unsubscribing later
                this.options.app_events[topic] = handler;
            }
            uijet.subscribe(topic, handler.bind(this));
            return this;
        },
        /*
         * @sign: unsubscribe(topic, [handler])
         * @return: this
         *
         * Unsubscribes a handler of a custom event with `topic` as type, if the handler is supplied, OR
         * all handlers under that `topic`.
         * It's a hook into the sandbox's unsubscribe method.
         */
        unsubscribe     : function (topic, handler) {
            uijet.unsubscribe(topic, handler);
            return this;
        },
        /*
         * @sign: publish(topic, [data], [is_global])
         * @return: this
         *
         * Triggers a custom event with type `topic`, handing it `data` as an argument.
         * If is_global is NOT set to `true` then the topic is prefixed with `this.id` and a '.'.
         * It's a hook into the sandbox's publish method.
         */
        publish         : function (topic, data, global) {
            topic = global ? topic : this.id + '.' + topic;
            uijet.publish(topic, data);
            return this;
        },
        /*
         * @sign: runRoute(route, [is_silent])
         * @return: this
         *
         * Runs a route.
         * If `is_silent` is supplied and is true this route will not propagate to the browser's address bar
         * and will only trigger the callback for that route.
         * It's a hook into the sandbox's runRoute method.
         */
        runRoute        : function (route, is_silent) {
            uijet.runRoute(route, is_silent);
            return this;
        },
        /*
         * @sign: select([initial])
         * @return: this
         *
         * Triggers a selection in the widget's UI, according to implementation.
         * In its base form only triggers the click event.
         * If `initial` is supplied and it's a function, and its result is a jQuery object then trigger click.
         * Otherwise (usually a string) find this element inside `this.$element` using `initial` as selector
         * and perform the click on the result.
         */
        select          : function (initial) {
            var $el;
            $el = typeof initial == 'function' ? initial.call(this) : this.$element.find(initial);
            $el.length && $el.click();
            return this;
        },
        /*
         * @sign: setInnerRouter()
         * @return: this
         *
         * Transforms `this.$element` to a gateway for routes by delegating all anchor clicks inside it
         * to the sandbox's runRoute method.
         * The 'is_silent' param is determined by the routing option:
         * If routing is `undefined` then it's `true`.
         * If it's a function then it is its call's result when the clicked anchor is handed to it.
         * Otherwise it is simply the opposite of the truthiness of routing.
         */
        setInnerRouter  : function () {
            var routing = this.options.routing, that = this;
            //TODO: switch to $element.on('click', 'a', function ...)
            this.$element.delegate('a, [data-route]', 'click', function (e) {
                var $this = $(this),
                    is_anchor = this.tagName.toLowerCase() == 'a',
                    _route = $this.attr(is_anchor ? 'href' : 'data-route');
                that.runRoute(_route, typeof routing == 'undefined' ? true : typeof routing == 'function' ? ! routing.call(that, $this) : ! routing);
                e.stopPropagation(); // confine the event here since it might break other handlers
                is_anchor && e.preventDefault(); // prevent because this is an INNER router
            });
            return this;
        },
        /*
         * @sign: setOptions([options])
         * @return: this
         *
         * Set this instance's options.
         */
        setOptions      : function (options) {
            this.options = Utils.extend(true, {}, this.options, options);
            return this;
        },
        /*
         * @sign: setInitOptions()
         * @return: this
         *
         * Perform initialization related tasks on this instance based on the options set.
         * This method is usually called once inside the `init` method flow, after `setOptions`.
         */
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
        /*
         * @sign: setId()
         * @return: this
         *
         * Sets the instance's id using the one set in the config OR the instance's $element OR
         * tries to create that $element and get its id.
         */
        //TODO: allow the automatic setting of a unique ID
        setId           : function () {
            this.id = this.options.id || (this.$element && this.$element[0].id) || this.setElement().$element[0].id;
            return this;
        },
        /*
         * @sign: setElement([element])
         * @return: this
         *
         * set the instance's $element either by getting it as a param OR from element option
         */
        //TODO: allow the creation of the element outside the `document` when it doesn't exist in the DOM
        setElement      : function (element) {
            if ( ! this.$element ) {
                element = element || this.options.element;
                this.$element = element.jquery ? element : $(element);
            }
            return this;
        },
        /*
         * @sign: getDataUrl()
         * @return: data_url
         *
         * Gets the URL used by the widget to fetch/send data.
         * Uses the instance's context object to replace params in the URL's pattern
         */
        getDataUrl      : function () {
            return this.substitute(this.options.data_url, this.context);
        },
        /*
         * @sign: getTemplateUrl()
         * @return: template_url
         *
         * Gets the URL used by the widget to fetch its template.
         * Uses the instance's context object to replace params in the URL's pattern
         */
        getTemplateUrl  : function () {
            return this.substitute(this.options.template_url, {});
        },
        /*
         * @sign: substitute(template, obj)
         * @return: String
         *
         * Does a simple string replace on the template using obj as the map of
         * params to values.
         * This method is used in getDataUrl & getTemplateUrl.
         */
        substitute      : function(template, obj) {
            var n = 0;
            return template.replace(SUBSTITUTE_REGEX, function(match, key){
                return Utils.isObj(obj) ? obj[key] : obj[n++];
            });
        },
        /*
         * @sign: setData(data)
         * @return: this
         *
         * Sets the instance's data with the given data argument.
         * Before the data is set it emits the 'process_data' signal.
         * If that signal's callback returns a defined falsy value then
         * data isn't set.
         * If data *was* set it sets the `has_data` of this instance to `true`.
         */
        setData         : function (data) {
            var success = this.notify('process_data', data);
            if ( typeof success != 'undefined' && ! success ) {
                return this;
            }
            this.data = data;
            this.has_data = true;
            return this;
        },
        /*
         * @sign: unshadow(elements, [do_unshadow])
         * @return: this
         *
         * Used in platforms where CSS shadows creates big performance issues.
         * Removes CSS box-shadows from the specified `elements` which is either HTML elements or a selector,
         * passed to jQuery.
         * If `do_ushadow` is a boolean it's used for toggeling the state.
         * Currently only works on iPad.
         * Internally this toggles the 'unshadow' class.
         */
        unshadow        : function (elements, do_unshadow) {
            uijet.is_iPad && $(elements).toggleClass('unshadow', typeof do_unshadow == 'boolean' ? do_unshadow : true);
            return this;
        },
        /*
         * @sign: remove()
         * @return: this
         *
         * Removes the instance's element, and wrapper if exists, from the DOM.
         * This is usually used inside destroy sequence.
         */
        remove          : function () {
            (this.$wrapper || this.$element).remove();
            return this;
        },
        _wrap           : function () {
            if ( ! this.$wrapper ) {
                this.$wrapper = this.$element.wrap($('<div/>', {
                    'class' : 'uijet_wrapper ' + this.options.type_class + '_wrapper',
                    id      : this.id + '_wrapper'
                })).parent();
            }
            return this;
        },
        _center         : function () {
            if ( ! this.$center_wrapper ) {
                this.$center_wrapper = this.$element.wrap($('<div/>', {
                    'class' : 'uijet_center_wrapper ' + this.options.type_class + '_center_wrapper'
                })).parent();
            }
            return this;
        },
        _getSize            : function () {
            var children = this.$element.children(),
                total_width = 0,
                total_height = 0,
                l = children.length,
                size = { width: 0, height: 0 },
                child;
            while ( child = children[--l] ) {
                total_width += child.offsetWidth;
                total_height += child.offsetHeight;
            }
            if ( this.options.horizontal ) {
                size.width = total_width;
                size.height = children[0].offsetHeight;
            } else {
                size.width = children[0].offsetWidth;
                size.height = total_height;
            }
            return size;
        },
        _setCloak       : function (cloak) {
            this.$element[0].style.visibility = cloak ? 'hidden' : 'visible';
            return this;
        },
        _setContext     : function () {
            if ( arguments.length && typeof arguments[0] != 'undefined' ) {
                this.context = arguments;
            }
            return this;
        },
        _saveOriginal   : function () {
            // save a reference to the child nodes of the element prior to rendering
            ! this.$original_children && (this.$original_children = this.$element.children());
            return this;
        },
        _clearRendered  : function () {
            // remove all children that were added with .render()
            this.$element.children().not(this.$original_children).remove();
            this.$element[0].setAttribute('style', ''); // needed to work around a Webkit bug
            this.$element[0].removeAttribute('style');
            this.has_content = false;
            return this;
        },
        _finally        : function () {
            this.signals = Object.create(this.signals_cache);
            this.options.state = this.awake ? 'current' : 'asleep';
        }
    };

    return Widget;
}));