(function (root, factory) {
    // set the BaseWidget class with the returned constructor function
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return (uijet.BaseWidget = factory(uijet, root));
        });
    } else {
        root.uijet.BaseWidget = factory(root.uijet, root);
    }
}(this, function (uijet, _window) {
    var Object = _window.Object,
        // cache the utilities namespace
        utils = uijet.utils,
        /**
         * Constructor for BaseWidget
         * 
         * @constructor
         * @class BaseWidget
         */
        Widget = function () {
            /**
             * The `context` object of the widget instance.
             * 
             * @type {{}}
             */
            var context = {};

            /**
             * Get the `context` object or a specific property in it.
             * 
             * @param {string} [key] - string for getting a specific property of the data `context` object.
             * @returns {*}
             * @private
             */
            this._getContext = function (key) {
                return key ? context[key] : context;
            };
            /**
             * Set a specific property in the `context` object to a given `value`, or
             * extend it with a given object.
             * 
             * @param {Object|string} ctx - the object to extend the `context` with, or key for a property to set.
             * @param {*} [value] - a value to set on `context` if the `ctx` argument is not an object.
             * @returns {BaseWidget}
             * @private
             */
            this._setContext = function (ctx, value) {
                utils.isObj(ctx) ?
                    utils.extend(context, ctx) :
                    context[ctx] = value;
                return this;
            };
        },
        POSITION_RE = /(fluid|top|bottom|right|left):?(\d+)?([^\d\|]+)?\|?(\d+)?([\D]+)?/,
        DIMENSIONS = {top:'height',bottom:'height',right:'width',left:'width'},
        DEFAULT_TYPE_CLASS = '_uijet_widget_',
        widget_id_index = 0,
        /**
         * Parses strings into DOM event type and, optionally,
         * a query selector for the target element to delegate the event from.
         * 
         * @param {string} type - a property name in a `dom_events` object.
         * @returns {Array} - the Array of the processed event type and target element. 
         */
        parseTypeAndTarget = function (type) {
            var parts = type && type.split(' ') || '',
                result;
            if ( parts.length > 1 ) {
                result = [parts.shift(), parts.join(' ')];
            }
            else if ( parts.length === 1 ) {
                result = parts;
            }
            else {
                throw new Error('Received a bad argument for DOM event type: ' + type);
            }
            return result;
        };

    /**
     * Public, inheritable methods of {@see Widget} class.
     */
    Widget.prototype = {
        constructor     : Widget,
        /**
         * Initializes a widget instance.
         * 
         * A *lifecycle method*, does all the possible lifting that can be done
         * before awaking/rendering.
         * 
         * `init()` is invoked by uijet when it is `init()`ed itself
         * or when you `start()` a widget ad-hoc.
         * 
         * @param {Object} options - config object for the widget.
         * @returns {Widget}
         */
        init            : function (options) {
            // ready...
            // FIGHT!
            this.setOptions(options)
                // set .id
                .setId()
                // set .$element
                .setElement()
                // hide the element to prevent browser rendering as much as possible
                ._setCloak(true)
                // parse the rest of the options, like events handling, etc.
                .setInitOptions()
                // register to sandbox
                .register()
                // wrapping, styling, positioning, etc.
                .prepareElement()
                // cache reference to initial markup that was coded into the element by user
                ._saveOriginal()

                .notify(true, 'post_init');

            return this;
        },
        /**
         * Registers the widget into uijet's sandbox.
         * 
         * *Note*: It is recommended to call `this._super()` first thing
         * when overriding this method, to make sure the widget is in the sandbox.
         * 
         * @returns {Widget}
         */
        register        : function () {
            if ( ! this.registered ) {
                uijet.register(this);
                this.registered = true;
            }
            return this;
        },
        /**
         * Unregisters the widget from uijet's sandbox.
         * 
         * @returns {Widget}
         */
        unregister      : function () {
            uijet.unregister(this);
            this.registered = false;
            return this;
        },
        /**
         * Gets the `context` object of the instance or the value
         * of a specific property.
         * 
         * @param {string} [key] - a name of a property in the `context` object.
         * @returns {*} - the value of the `key` or the `context` object.
         */
        getContext      : function (key) {
            return this._getContext(key);
        },
        /**
         * Sets properties on the `context` object.
         * Either using a map of properties or key and a value.
         * 
         * @param {Object|string} ctx - a map of properties to set on the `context` or a name of a property to set.
         * @param [value] - if `ctx` is a string representing a key the this will be its value.
         * @returns {Widget}
         */
        setContext      : function (ctx, value) {
            return this._setContext(ctx, value);
        },
        /**
         * Starts up the widget.
         * A *lifecycle method*, renders the widget, attaches all
         * DOM events to it and brings it into view.
         * 
         * Takes an optional `context` parameter that will be passed to
         * {@see setContext()} if it is an `Object`, to `pre_wake` and
         * `post_wake` signals and to {@see wakeContained()}.
         * 
         * Every widget also wakes its contained widgets, so this triggers
         * a recursive action that wakes the whole widgets branch downwards.
         * 
         * @param {*} [context] - possibly an `Object` containing properties to set on the `context`.
         * @returns {Promise} - resolved when all contained widgets successfully wake or rejected in case of error.
         */
        wake            : function (context) {
            var that = this,
                dfrds, success;
            // if already awake and there's no new data coming in then no reason to continue
            if ( this.awake && ! context ) return this._finally();
            // if `context` is an object
            if ( utils.isObj(context) ) {
                // use it to update the instance's `context`
                this.setContext(context);
            }
            // fire `pre_wake` signal
            // send the `context` argument as a second param
            this.notify(true, 'pre_wake', context);
            // the rest of the tasks needed to be performed
            success = function () {
                // there was context to change but if we're set then bail out
                if ( ! that.awake ) {
                    that.render()
                        // bind DOM events
                        .bindAll()
                        .appear()
                        .awake = true;
                }
                that.notify(true, 'post_wake', context);
                that._finally();
            };
            // wake up all contained widgets
            dfrds = this.wakeContained(context);

            // if this widget is to be waken up in sync with its children then let it call
            // success once they're done, or fail if any fails
            // otherwise call success
            return uijet.whenAll(dfrds).then(
                this.options.sync ? success : success(),
                function () {
                    that.notify(true, 'wake_failed', arguments);
                    that.sleep();
                }
            );
        },
        /**
         * Wakes up contained widgets.
         * 
         * Takes an optional `context` argument that is passed to the {@see wake()}
         * calls of the contained widgets.
         * 
         * @param {*} [context] - optional context for contained widgets.
         * @returns {Promise[]}
         */
        wakeContained   : function (context) {
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
                this.notify(true, 'pre_sleep');
                // unbind DOM events
                this.unbindAll()
                    // hide
                    .disappear(no_transitions)
                    // stop contained widgets
                    .sleepContained()
                    .awake = false;
                // perform destroy if asked to
                if ( this.options.destroy_on_sleep ) {
                    return this.destroy();
                }
                this.notify(true, 'post_sleep');
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
            this.notify(true, 'pre_destroy');
            // perform a recursive destruction down the widget tree
            this.destroyContained();
            // unsubscribe to app events
            this.app_events && this.unsubscribe(this.app_events);
            // unregister from uijet
            this.unregister()
                .unbindAll()
                .unlisten()
                .remove();

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
        // ### widget.prepareElement
        // @sign: prepareElement()  
        // @return: this
        //
        // Prepares the instance's element by setting attributes and styles.  
        // In its basic format adds classes and calls `style` and `position`.  
        // This is usually called once in the init sequence.
        prepareElement  : function () {
            var classes = 'uijet_widget ' +
                    utils.toArray(this.options.type_class).join(' '),
                el = this.$element[0],
                style, position;
            this.options.extra_class && (classes += ' ' + this.options.extra_class);
            this.$element.addClass(classes);
            // check if inside DOM
            if ( el.ownerDocument.body.contains(el) ) {
                style = utils.returnOf(this.options.style, this);
                position = utils.returnOf(this.options.position, this);

                position && this.position(position);
                style && this.style(style);
            }
            return this;
        },
        // ### widget.style
        // @sign: style()  
        // @return: this
        //
        // Sets the instance element's style in case the `style` option is set.  
        // It makes sure the the element is wrapped first and sets those style properties on the `$wrapper`.  
        // It uses a `jQuery.css` like operation on the wrapper element with the option's value.  
        // This is usually called once in the init sequence.
        style           : function (style, value) {
            if ( ! arguments.length || (value === void 0 && typeof style == 'string') || utils.isArr(style) ) {
                return utils.getStyle(this.$wrapper[0], style);
            }
            this._wrap()
                .$wrapper.css(style, value);
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
        // If it's an `Object` then it's used as argument for a `jQuery.css` like call on the `$wrapper`.  
        // This is usually called once in the init sequence, then the option is deleted
        // to prevent unnecessary repeating of this call.
        position        : function (position) {
            var processed, style, has_fluid_side, exclude = [];
            this._wrap();

            if ( typeof position == 'string') {
                if ( position == 'center') {
                    this._center();
                }
                else if ( position == 'fluid' ) {
                    uijet.position(this);
                }
                else {
                    processed = {};
                    style = {};
                    position.split(' ').forEach(function (pair) {
                        var match = POSITION_RE.exec(pair),
                            side = match && match[1],
                            number, size_unit, margin_unit, has_margin;

                        if ( side ) {
                            if ( side === 'fluid' ) {
                                has_fluid_side = true;
                                return;
                            }
                            else {
                                exclude.push(side);
                                if ( match[3] == 'fluid' ) {
                                    has_fluid_side = true;
                                    return;
                                }
                            }

                            size_unit = match[3] || 'px';
                            margin_unit = match[5] || 'px';

                            // add padding or stick to side
                            number = +match[4];
                            // cache the numeric part
                            processed[side] = { size : number || 0 };
                            // add the units part for styling
                            number = number ?
                                margin_unit ?
                                    number + margin_unit :
                                    number :
                                0;
                            has_margin = !!number;
                            style[side] = number;

                            // process width/height if found
                            number = +match[2];
                            if ( number ) {
                                // if no margin or using the same unit (no need to calc)
                                //TODO: add option to use CSS calc
                                if ( ! has_margin || margin_unit === size_unit ) {
                                    // aggregate that dimension's length and add the unit
                                    processed[side].size = (processed[side].size + number);
                                    processed[side].unit = size_unit;
                                }
                                style[DIMENSIONS[side]] = number + (size_unit || 0);
                            }
                        }
                    });
                    // cache the parsed position for quick JIT positioning of fluid siblings
                    this.processed_position = processed;
                    style.position = 'absolute';
                    // continue to next if statement passing the parsed `style` object
                    position = style;
                    // use `uijet.position` to position according to this widget's siblings
                    has_fluid_side && uijet.position(this, exclude);
                }
            }
            if ( utils.isObj(position) ) {
                this.style(position);
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
        // ### widget.compile
        // @sign: compile(template, [partial])  
        // @return: template OR compiled_template
        //
        // Compiles a template and returns a compiled version of that template as a `Function`.
        // By default it simply returns `template` and should be overridden with an implementation of the chosen engine.
        // It takes an optional `partial` string that is used as the partial's name.
        // It tells engine to treat `template` as a partial.
        compile         : function (template, partial) {
            return template;
        },
        // ### widget.render
        // @sign: render()  
        // @return: this
        //
        // Renders the instance.  
        // In its base form this it's just a placeholder.
        render          : function () {
            this.notify(true, 'pre_render');
            return this;
        },
        // ### widget.appear
        // @sign: appear()  
        // @return: this
        //
        // Makes the instance's element appear (initially `visibility` is set to `hidden`).
        appear          : function () {
            this.notify(true, 'pre_appear');
            this._setCloak(false)
                .notify(true, 'post_appear');
            return this;
        },
        // ### widget.disappear
        // @sign: disappear()  
        // @return: this
        //
        // Makes the instance's element disappear, basically setting `visibility` to `hidden`.
        disappear       : function () {
            this._setCloak(true)
                .notify(true, 'post_disappear');
            return this;
        },
        // ### widget.bind
        // @sign: bind()  
        // @return: this
        //
        // Binds a `handler` on DOM event specified by `type` to the instance's element.  
        // Sets `bound` to `true` at the end.  
        //TODO: this overrides existing `type` with a new one - if this is not the required outcome implement using a list of handlers
        bind            : function (type, handler) {
            var _h = utils.isFunc(handler) ? handler : this._parseHandler(handler),
                // parse type to check if there's a selector to delegate to
                bind_args = parseTypeAndTarget(type);
            bind_args.push(_h.bind(this));

            if ( !(type in this.options.dom_events) ) {
                // cache the original handler
                this.options.dom_events[type] = _h;
            }
            // and the bound one
            this._bound_dom_events.push(bind_args);

            // bind to the DOM
            this.$element.on.apply(this.$element, bind_args);
            // raise the `bound` flag to make sure it's unbounded before any `bindAll` call
            this.bound = true;
            return this;
        },
        // ### widget.unbind
        // @sign: unbind(type, [handler])  
        // @return: this
        //
        // Unbinds a DOM event specified by `type` from the instance's element.  
        // If `handler` is supplied it will attempt to unbind this specific handler only from that `type` of event.  
        // This will not remove that handler from being bound again with `bindAll` on next `wake`.  
        unbind          : function (type, selecetor, handler) {
            var bind_args = parseTypeAndTarget(type);

            if ( bind_args.length === 1 || utils.isFunc(selecetor) )
                bind_args.push(selecetor);

            if ( bind_args.length < 3 && utils.isFunc(handler) ) 
                bind_args.push(handler);

            this.$element.off.apply(this.$element, bind_args);

            return this;
        },
        // ### widget.bindAll
        // @sign: bindAll()  
        // @return: this
        //
        // Binds DOM events related to the instance's element, based on the `dom_events` option.  
        // At the end sets the `bound` flag to `true`.  
        // This is called every time the widget is awaken.  
        bindAll         : function () {
            var n;
            // in case something was bound
            if ( this.bound ) {
                // unbind all so to not have the same event bound more than onceZ
                this.unbindAll();
            }
            // and in the darkness bind them
            for ( n in this._bound_dom_events )
                this.$element.on.apply(this.$element, this._bound_dom_events[n]);

            this.bound = true;

            return this;
        },
        // ### widget.unbindAll
        // @sign: unbindAll()  
        // @return: this
        //
        // Unbinds all DOM events related to the instance's element, based on the `dom_events` option.  
        // At the end sets the `bound` flag to `false`.  
        // This is usually called every time the widget is put to sleep.  
        unbindAll       : function () {
            var n;
            // if we have any DOM events that are bound
            if ( this.bound ) {
                // unbind all
                for ( n in this._bound_dom_events )
                    this.$element.off.apply(this.$element, this._bound_dom_events[n]);
            }
            this.bound = false;
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
            var event_type = this.options.click_event,
                $el;
            $el = typeof initial == 'function' ? initial.call(this) : this.$element.find(initial);
            typeof $el.trigger == 'function' && $el.trigger(event_type || uijet.support.click_events.full);
            return this;
        },
        // ### widget.captureRoutes
        // @sign: captureRoutes()  
        // @return: this
        //
        // Transforms `this.$element` to a gateway for routes by delegating all anchor or `uijet-route` clicks inside it
        // to `uijet.runRoute`.  
        // The 'is_silent' param for `runRoute` is the opposite of the truthiness of `routing` option.  
        // This is usually called once in the init sequence.
        captureRoutes   : function () {
            var routing = this.options.routing,
                capture_href = this.options.capture_href,
                selector = '[data-uijet-route]',
                that = this;
            capture_href && (selector += ',a');
            this.$element.on(uijet.support.click_events.full, selector, function (e) {
                var $this = uijet.$(this),
                    is_anchor = this.tagName.toLowerCase() == 'a',
                    _route = that.substitute(
                        $this.attr(is_anchor && capture_href ? 'href' : 'data-uijet-route'),
                        that.context
                    );
                if ( uijet.options.routed ) {
//                    that.runRoute(_route, typeof routing == 'undefined' ? true : typeof routing == 'function' ? ! routing.call(that, $this) : ! routing);
                    that.runRoute(_route, ! utils.returnOf(routing, that, $this));
                } else {
                    uijet.publish(_route);
                }
                // contain the route to this widget only
                e.stopPropagation();
                // prevent because this is an INNER router
                is_anchor && capture_href && e.preventDefault();
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
            this.options = utils.extend(true, {}, this.options || {}, options);
            // make sure DOM events maps are initialized
            ! this.options.dom_events && (this.options.dom_events = {});
            ! this._bound_dom_events && (this._bound_dom_events = []);
            // make sure we have a `type_class` option set
            ! this.options.type_class && (this.options.type_class = DEFAULT_TYPE_CLASS);
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
                _signals, n, handler, bind_args;
            this.app_events = {};
            // listen to all signals set in options
            if ( _signals = ops.signals ) {
                for ( n in _signals ) {
                    this.listen(n, _signals[n]);
                }
            }
            if ( ops.wake_on_startup ) {
                this.subscribe('startup', function () { this.wake(); });
            }
            // subscribe to all app (custom) events set in options
            if ( ops.app_events ) {
                for ( n in _app_events ) {
                    this.subscribe(n, _app_events[n]);
                }
            }
            for ( n in ops.dom_events ) {
                bind_args = parseTypeAndTarget(n);
                handler = ops.dom_events[n];
                bind_args.push(
                    utils.isFunc(handler) ?
                       handler.bind(this) :
                       this._parseHandler(handler)
                );
                this._bound_dom_events.push(bind_args);
            }
            // capture and delegate all `uijet-route` and/or anchor clicks to routing/publishing mechanism
            this.captureRoutes();
            return this;
        },
        // ### widget.setId
        // @sign: setId()  
        // @return: this
        //
        // Sets the instance's `id` using the one set in the config OR the instance's `$element`'s OR
        // tries to create that `$element` and get its `id`.  
        // If all fails generates an id from the widget's type and a running index.  
        // This is usually called once in the init sequence.  
        setId           : function () {
            this.id = this.options.id ||
                (this.$element && this.$element[0].id) ||
                this.setElement().$element[0].id ||
                this._generateId();
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
                // if it's not a result object of the DOM library then wrap it
                this.$element = (element[0] && element[0].nodeType) ? element : uijet.$(element);
            }
            return this;
        },
        // ### widget.getRestUrl
        // @sign: getRestUrl(url, [context])  
        // @return: rest_url
        //
        // Gets a RESTful object representation of a URL with a `path` and `method` values.  
        // `url` can be either a `String` or an `Object` with a `path` and `method` values.  
        // Takes an optional `Object` argument to be used as context for parsing the URL,
        // by default uses `this.context`, and parses the URL using `this.substitute`.  
        // `method` is `GET` by default.
        getRestUrl      : function (_url, _context) {
            var context = _context || this.context,
                url = utils.returnOf(_url, this, context),
                path;
            // if we have a URL to send to
            if ( url ) {
                if ( typeof url == 'string' ) {
                    // parse the URL
                    path = this.substitute(url, context);
                }
                else if ( utils.isObj(url) ) {
                    // or parse the URL under __path__
                    path = this.substitute(url.path, context);
                } else {
                    return;
                }
                return {
                    method: url.method || 'GET',
                    path: path || (url.path ? url.path : url)
                };
            }
        },
        // ### widget.substitute
        // @sign: substitute(template, obj)  
        // @return: String
        //
        // Does a simple string replace on the template using `obj` as the map of
        // params to values.  
        // This method is used in `getRestUrl()`.
        substitute      : utils.format,
        // ### widget.remove
        // @sign: remove([reinsert])  
        // @return: widget_top_element OR this
        //
        // Removes the instance's element, and wrapper if exists, from the DOM.  
        // This is usually used inside destroy sequence.  
        // Returns the removed element  
        //TODO: write a method that gets the top level element
        remove          : function (reinsert) {
            var el = (this.$wrapper || this.$center_wrapper || this.$element)[reinsert ? 'detach' : 'remove']();
            return reinsert ? el : this;
        },
        // ### widget._generateId
        // @sign: _generateId()  
        // @return: id
        //
        // Generates an id for the instance using the type_class option (sans the 'uijet_' prefix) + a suffix of '_'
        // and an auto-incremented index.
        _generateId     : function () {
            var id =  utils.toArray(this.options.type_class)
                            .splice(-1, 1).toString()
                            .replace('uijet_', '') + '_' + (++widget_id_index);
            this.$element.attr('id', id);
            return id;
        },
        /**
         * Utility for wrapping the widget's element in a container element.
         * 
         * Related options:
         * * `dont_wrap`: skips wrapping and sets `$wrapper` to `$element`.
         * * `wrapper_class`: extra class names to be set on the container element.
         * * `wrapper_tag`: a name of a tag to use for the container element. Defaults to `div`.
         * 
         * @returns {Widget}
         * @private
         */
        _wrap           : function () {
            var classes;
            if ( ! this.$wrapper ) {
                if ( this.options.dont_wrap ) {
                    this.$wrapper = this.$element;
                } else {
                    classes = 'uijet_wrapper ' + utils.toArray(this.options.type_class).join('_wrapper ') + '_wrapper';
                    this.options.wrapper_class && (classes += ' ' + this.options.wrapper_class);
                    // wrap and cache the wrapper
                    this.$wrapper = this.$element.wrap(uijet.$('<' + (this.options.wrapper_tag || 'div') + '>', {
                        'class' : classes,
                        id      : this.id + '_wrapper'
                    })).parent();
                }
            }
            return this;
        },
        /**
         * Centers the widget, vertically and horizontally.
         * 
         * @returns {Widget}
         * @private
         */
        _center         : function () {
            if ( ! this.$center_wrapper ) {
                this.$wrapper.addClass('center');
                // wrap and cache the wrapper
                this.$center_wrapper = this.$element.wrap(uijet.$('<div/>', {
                    'class' : 'uijet_center_wrapper ' +
                        utils.toArray(this.options.type_class).join('_center_wrapper ') +
                        '_center_wrapper'
                })).parent();
            }
            return this;
        },
        /**
         * Gets the size of a widget's element, taking its child elements into account.
         * 
         * @returns {{width: number, height: number}}
         * @private
         */
        _getSize        : function () {
            var $children = this.$element.children(),
                // cache `window` in this scope
                __window = _window,
                last_child = $children.get(-1),
                size = { width: 0, height: 0 },
                // since the default overflow of content is downward just get the last child's position + height
                total_height = last_child && (last_child.offsetTop + last_child.offsetHeight) || 0,
                total_width = 0,
                l = $children.length;
            if ( this.options.horizontal ) {
                // since HTML is finite horizontally we *have* to count all children
                $children.each(function (i, child) {
                    // get the computed style object
                    var style = __window.getComputedStyle(child, null);
                    // add the total width of each child + left & right margin
                    total_width += child.offsetWidth + (+style.marginLeft.slice(0,-2)) + (+style.marginRight.slice(0,-2));
                });
                size.width = total_width;
                // height is by default the total height of the first child
                $children.length && (size.height = $children[0].offsetHeight);
            } else {
                // it's a vertical widget  
                // width is by default the total width of the first child
                $children.length && (size.width = $children[0].offsetWidth);
                size.height = total_height;
            }
            return size;
        },
        /**
         * Toggles the element's `visibility`, depending on the `cloak` param.
         * 
         * If `cloak` is truthy it's set to `hidden`, otherwise to `visible`.
         * 
         * This is used to minimize paints while the widget is asleep.
         * 
         * @param {boolean} [cloak] - whether to cloak the element.
         * @returns {Widget}
         * @private
         */
        _setCloak       : function (cloak) {
            this.$element[0].style.visibility = cloak ? 'hidden' : 'visible';
            return this;
        },
        /**
         * Saves reference to all child elements prior to any rendering.
         * 
         * This is done on {@see init()} and used to keep elements that
         * should not be touched when rendering the contents of the widget.
         * 
         * @returns {Widget}
         * @private
         */
        _saveOriginal   : function () {
            ! this.$original_children && (this.$original_children = this.$element.children());
            return this;
        },
        /**
         * Removes all elements created by rendering the widget,
         * e.g. results from calling {@see render()}, meaning all that's *not* in
         * `$original_children`, set by {@see _saveOriginal()} on {@see init()}.
         * 
         * Related options:
         * * `extend_rendered`: set to `true` if you wish to keep the content with every render.
         * 
         * @returns {Widget}
         * @private
         */
        _clearRendered  : function () {
            var extend_rendered = this.options.extend_rendered;
            extend_rendered === void 0 && (extend_rendered = !!this.options.extend_data);
            if ( this.bound ) {
                this.unbindAll();
            }
            if ( ! extend_rendered ) {
                // remove all children that were added with .render()
                this.$element.children().not(this.$original_children).remove();
                this.has_content = false;
            }
            return this;
        },
        /**
         * Cleans up all lifecycle related operations.
         * 
         * A utility method that's called at the end of every lifecycle method call.
         * If you wish to forcibly allow signals, that are triggered once per
         * lifecycle stage - e.g. `pre_render`, to be triggerable again call this method.
         * 
         * @returns {Widget}
         * @private
         */
        _finally        : function () {
            // replace the masking `Object` with a new one
            this.signals = Object.create(this.signals_cache);
            this.options.state = this.awake ? 'current' : 'asleep';
            return this;
        }
    };

    return uijet.Base.derive(Widget);
}));
