(function (_window) {
    var uijet = _window.uijet,
        $ = _window.jQuery, // yes, we use jQuery
        Utils = uijet.Utils, // cache the utilities namespace
        Widget = function () {}, // constructor for BaseWidget
        CONFIG_ATTR = 'data-uijet-config',
        TYPE_ATTR = 'data-uijet-type',
        SUBSTITUTE_REGEX = /\{([^\s\}]+)\}/g;

    Utils.extend(Widget.prototype, {
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
            if ( this.awake && ! context ) return this; // no reason to continue
            // prepare a pre_wake signal
            args = ['pre_wake'].concat(Array.prototype.slice.call(arguments));
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
            return this;
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
                // remove DOM elements
                .remove();
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
            $.ajax({
                url     : this.getDataUrl(),
                type    : 'get',
                dataType: 'json',
                context : this
            }).done(_success)
              .fail(function (response) {
                var _abort_fail = this.notify.apply(this, ['update_error'].concat(Array.prototype.slice.call(arguments), _success.bind(this)));
                if ( _abort_fail !== false ) {
                    this.publish('update_error', response, true);
                    dfrd_update.reject(response);
                }
            });
            return dfrd_update.promise();
        },
        fetchTemplate   : function (refresh) {
            return {};
        },
        prepareElement  : function () {
            this.$element.addClass('uijet_widget ' + this.options.type_class);
            this.setStyle()
                .position();
            return this;
        },
        setStyle        : function () {
            var _style = this.options.style;
            if ( _style ) {
                this._wrap()
                    .$wrapper.css(_style);
            }
            return this;
        },
        generate        : function () {
            throw new Error('generate not implemented');
        },
        render          : function () {
            this.notify('pre_render');
            return this;
        },
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
        appear          : function () {
            this._setCloak(false);
            this.notify('post_appear');
            return this;
        },
        disappear       : function () {
            this._setCloak(true);
            this.notify('post_disappear');
            return this;
        },
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
        unbind          : function () {
            var _dom_events;
            if ( _dom_events = this.options.dom_events ) {
                this.$element.unbind(this._bound_dom_events);
            }
            this.bound = false;
            return this;
        },
        listen          : function (topic, handler) {
            this[topic] = handler;
            return this;
        },
        unlisten        : function (topic) {
            if ( this[topic] ) delete this[topic];
            return this;
        },
        notify          : function (topic) {
            if ( this[topic] ) {
                var args = Array.prototype.slice.call(arguments, 1);
                return this[topic].apply(this, args);
            }
        },
        subscribe       : function (topic, handler) {
            if ( ! (topic in this.options.app_events) ) {
                this.options.app_events[topic] = handler;
            }
            uijet.subscribe(topic, handler.bind(this));
            return this;
        },
        unsubscribe     : function (topic, handler) {
            uijet.unsubscribe(topic, handler);
            return this;
        },
        publish         : function (topic, data, global) {
            topic = global ? topic : this.id + '.' + topic;
            uijet.publish(topic, data);
            return this;
        },
        runRoute        : function (route, is_silent) {
            uijet.runRoute(route, is_silent);
            return this;
        },
        select          : function (initial) {
            var $el;
            $el = typeof initial == 'function' ? initial.call(this) : this.$element.find(initial);
            $el.length && $el.click();
            return this;
        },
        setInnerRouter  : function () {
            var routing = this.options.routing, that = this;
            //TODO: switch to $element.on('click', 'a', function ...)
            this.$element.delegate('a', 'click', function (e) {
                var $this = $(this);
                uijet.runRoute($this.attr('href'), typeof routing == 'undefined' ? true : typeof routing == 'function' ? ! routing.call(that, $this) : ! routing);
                return false;
            });
        },
        setOptions      : function (options) {
            this.options = Utils.extend(true, {}, this.options, options);
            return this;
        },
        setInitOptions  : function () {
            var ops = this.options, _signals, _app_events;
            // listen to all signals set in options
            if ( _signals = ops.signals ) {
                for ( var n in _signals ) {
                    this.listen(n, _signals[n]);
                }
            }
            // subscribe to all app (custom) events set in options
            if ( _app_events = ops.app_events ) {
                for ( n in _app_events ) {
                    this.subscribe(n, _app_events[n]);
                }
            }
            // capture and delegate all anchor clicks to an inner routing mechanism
            if ( ~ 'function boolean undefined'.indexOf(typeof ops.routing) ) {
                this.setInnerRouter();
            }
            return this;
        },
        setId           : function () {
            this.id = this.options.id || (this.$element && this.$element[0].id) || this.setElement().$element[0].id;
            return this;
        },
        setElement      : function (element) {
            if ( ! this.$element ) {
                element = element || this.options.element;
                this.$element = element.jquery ? element : $(element);
            }
            return this;
        },
        getDataUrl      : function () {
            return this.substitute(this.options.data_url, this.context);
        },
        getTemplateUrl  : function () {
            return this.substitute(this.options.template_url, {});
        },
        substitute      : function(template, obj) {
            var n = 0;
            return template.replace(SUBSTITUTE_REGEX, function(match, key){
                return Utils.isObj(obj) ? obj[key] : obj[n++];
            });
        },
        setData         : function (data) {
            var success = this.notify('process_data', data);
            if ( typeof success != 'undefined' && ! success ) {
                return this;
            }
            this.data = data;
            this.has_data = true;
            return this;
        },
        unshadow        : function (elements, do_unshadow) {
            uijet.is_iPad && $(elements).toggleClass('unshadow', typeof do_unshadow == 'boolean' ? do_unshadow : true);
            return this;
        },
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
        }
    });

    uijet.BaseWidget = Widget;
}(window));
