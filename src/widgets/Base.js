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
    /**
     * The base widget class.
     * 
     * @exports Widget
     * @memberOf uijet
     */
    var Object = _window.Object,
        // cache the utilities namespace
        utils = uijet.utils,
        /**
         * Constructor for the base widget class.
         * 
         * @constructor
         * @class Widget
         * @alias BaseWidget
         * @extends uijet.Base
         */
        Widget = function () {
            /**
             * The `context` object of the widget instance.
             * 
             * @memberOf BaseWidget
             * @name context
             * @type {Object}
             * @inner
             */
            var context = {};

            /**
             * Get the `context` object or a specific property in it.
             * 
             * @memberOf BaseWidget
             * @instance
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
             * @memberOf BaseWidget
             * @instance
             * @param {Object|string} ctx - the object to extend the `context` with, or key for a property to set.
             * @param {*} [value] - a value to set on `context` if the `ctx` argument is not an object.
             * @returns {Widget}
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
     * Public, inheritable methods of {@link Widget} class.
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
         * Signals:
         * * `post_init`: triggered at the end of this method.
         * 
         * @memberOf BaseWidget
         * @instance
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
         * @memberOf BaseWidget
         * @instance
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
         * @memberOf BaseWidget
         * @instance
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
         * @memberOf BaseWidget
         * @instance
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
         * @memberOf BaseWidget
         * @instance
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
         * Every widget also wakes its contained widgets, so this triggers
         * a recursive action that wakes the whole widgets branch downwards.
         * 
         * Takes an optional `context` parameter that will be passed to
         * {@link BaseWidget#setContext} if it is an `Object`, to `pre_wake` and
         * `post_wake` signals and to {@link BaseWidget#wakeContained}.
         * 
         * Signals:
         * * `pre_wake`: triggered before waking of contained widgets, takes `wake()`'s `context` param as argument.
         * If it returns `false` the instance will not call {@link BaseWidget#render}.
         * * `post_wake`: triggered at the end of a successful wake, takes `wake()`'s `context` param as argument.
         * * `wake_failed`: triggered at the end of a failed wake, takes all arguments of the rejected {@link BaseWidget#wakeContained}.
         * If it returns `true` `wake()` will be invoked again.
         * 
         * Related options:
         * * `sync`: when `true` a successful starting sequence will only begin once all promises returned by `wake()` calls
         * of all child components are resolved. Otherwise, will start immediately.
         * 
         * @memberOf BaseWidget
         * @instance
         * @param {*} [context] - possibly an `Object` containing properties to set on the `context`.
         * @returns {Promise} - resolved when all contained widgets successfully wake or rejected in case of error.
         */
        wake            : function (context) {
            var that = this,
                do_render, contained_wakes, success, fail, activate;
            // if already awake and there's no new data coming in then no reason to continue
            if ( this.awake && ! context ) return this._finally();
            // if `context` is an object
            if ( utils.isObj(context) ) {
                // use it to update the instance's `context`
                this.setContext(context);
            }
            // fire `pre_wake` signal the `context` param as an argument
            // if `do_render` is `false` it will disable rendering
            do_render = this.notify(true, 'pre_wake', context);

            // wake up all contained widgets
            contained_wakes = this.wakeContained(context);

            // in case of failure
            fail = function (e) {
                // notify failure signal
                if ( true === that.notify.apply(that, [true, 'wake_failed'].concat(Array.prototype.slice.call(arguments))) ) {
                    // if user asked to retry the wake again
                    return that.wake();
                } else {
                    that.sleep();
                    return uijet.Promise().reject(e);
                }
            };

            // final activation once all is ready
            activate = function () {
                var appearance;
                // there was context to change but if we're set then bail out
                if ( ! that.awake ) {
                    // bind DOM events
                    that.bindAll();
                    // show it
                    appearance = that.appear();
                    that.awake = true;
                }
                that.notify(true, 'post_wake', context);
                that._finally();
                // in case there's an animation on `appear()`
                return appearance;
            };

            // in case of success
            if ( do_render === false ) {
                success = activate;
            }
            else {
                success = function () {
                    return uijet.when(that.render())
                        .then(activate, fail);
                };
            }

            // if this widget is to be waken up in sync with its children then let it call
            // success once they're done, or fail if any fails
            // otherwise call success
            return uijet.whenAll(contained_wakes).then(
                this.options.sync ? success : success(),
                fail
            );
        },
        /**
         * Wakes up contained widgets.
         * 
         * Takes an optional `context` argument that is passed to the {@link BaseWidget#wake}
         * calls of the contained widgets.
         * 
         * @memberOf BaseWidget
         * @instance
         * @param {*} [context] - optional context for contained widgets.
         * @returns {Promise[]}
         */
        wakeContained   : function (context) {
            return uijet.wakeContained(this.id, context);
        },
        /**
         * Stops a started widget.
         * A *lifecycle method*, hides the widget and removes all
         * DOM events from it.
         * Every contained widget will also be stopped and this
         * will continue trickling down recursively.
         * 
         * Related options:
         * * `destroy_on_sleep`: if `true` this widget will self destruct when put to sleep.
         * 
         * Signals:
         * * `pre_sleep`: triggered at the beginning of this instance is awake.
         * * `post_sleep`: triggered at the end of this instance is awake.
         * 
         * @memberOf BaseWidget
         * @instance
         * @param {boolean} [no_transitions] - whether to use a transition, if specified, for hiding. 
         * @returns {Widget}
         */
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
        /**
         * Stops contained widgets.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */
        sleepContained  : function () {
            uijet.sleepContained(this.id);
            return this;
        },
        /**
         * Cleans up all related DOM, memory and events related to 
         * this instance.
         * A *lifecycle method*, destroys the instance and all its contained widgets.
         * 
         * Signals:
         * * `pre_destroy`: triggered at the beginning.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */
        destroy         : function () {
            this.notify(true, 'pre_destroy');
            // perform a recursive destruction down the widget tree
            this.destroyContained();
            // unsubscribe to app events
            this.app_events && this.unsubscribe(this.app_events);
            // unregister from the uijet sandbox
            this.unregister()
                .unbindAll()
                .unlisten()
                .remove();

            return this;
        },
        /**
         * Cleans up all contained widgets using {@link BaseWidget#destroy}.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */
        destroyContained: function () {
            uijet.destroyContained(this.id);
            return this;
        },
        /**
         * Initializes the instance's element.
         * 
         * Related options:
         * * `type_class`: classes that define the type of the widget's component and are set on the elements `class` attribute.
         * * `extra_class`: space separated class names to be added to the element's `class` attribute.
         * * `position`: `string|Object` to be passed to {@link BaseWidget#position}.
         * * `style`: `string|Array|Object` to be passed to {@link BaseWidget#style}.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */
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
        /**
         * Gets or sets the style of the instance's top container (`this.$wrapper`).
         * As a getter this is delegated to {@link uijet.utils#getStyle}.
         * As a setter this is delegated to the DOM module's `css()` method. 
         * 
         * If no arguments are supplied it returns the entire computed style object of
         * the top container of the instance's element.
         * 
         * @memberOf BaseWidget
         * @instance
         * @param {string|Array|Object} [style] - an attribute name, or names to get, or a map of attributes and values to set.
         * @param {string|number|function} [value] - a value to set for the given style attribute in `style`.
         * @returns {string|string[]|CSSStyleDeclaration|Widget} - returns the result of {@link uijet.utils#getStyle} or `this`.
         */
        style           : function (style, value) {
            if ( ! arguments.length || (value === void 0 && typeof style == 'string') || utils.isArr(style) ) {
                return utils.getStyle(this.$wrapper[0], style);
            }
            this._wrap()
                .$wrapper.css(style, value);
            return this;
        },
        /**
         * Positions the instance's element with respect to its
         * sibling widgets, according to value of `position`:
         * 
         * * `'center'`: centers the widget.
         * * `'fluid'`: stretches the widget according to its container and siblings.
         * * other `string`: parses `position` and positions the widget according to its container and siblings.
         * * `Object`: passes `position` to {@link BaseWidget#style}.
         * 
         * This method will always attempt to {@link BaseWidget#_wrap} the instance's element.
         * 
         * While positioning widgets using this method is handy for scaffolding
         * fluid UIs, performance wise it's best to ultimately do positioning
         * using CSS, unless dynamic run-time dimensions calculation is required.
         * 
         * @memberOf BaseWidget
         * @instance
         * @param {string|Object} position - directives for positioning the instance's container element.
         * @returns {Widget}
         */
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
        /**
         * Placeholder for rendering logic.
         * 
         * Signals:
         * * `pre_render`: triggered at the beginning.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */
        render          : function () {
            this.notify(true, 'pre_render');
            return this;
        },
        /**
         * Makes the instance's element appear in the UI.
         * By default this only calls {@link BaseWidget#_setCloak} which toggles `visibility`.
         * 
         * Signals:
         * * `pre_appear`: triggered at the beginning.
         * * `post_appear`: triggered at the end.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */
        appear          : function () {
            this.notify(true, 'pre_appear');
            this._setCloak(false)
                .notify(true, 'post_appear');
            return this;
        },
        /**
         * Makes the instance's element disappear from the UI.
         * 
         * Signals:
         * * `post_disappear`: triggered at the end.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */
        disappear       : function () {
            this._setCloak(true)
                .notify(true, 'post_disappear');
            return this;
        },
        /**
         * Binds `handler` to an event specified by `type` on the
         * instance's element.
         * Inside the handler `this` refers the instance,
         * and has the same parameters as an event handler of the
         * used DOM module.
         * 
         * `type` may contain a query selector, space separated,
         * for a descendant target element of `this.$element` for
         * delegating the event from that target only.
         * 
         * `handler` can be a name of a method of the instance,
         * a type of a signal that has a handler connected to it,
         * or as a default a topic that will be published as an
         * `app_event`.
         * 
         * @memberOf BaseWidget
         * @instance
         * @param {string} type - the type of the event to bind to.
         * @param {function|string} handler - the event handler or a string that represents it.
         * @returns {Widget}
         */  
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
        /**
         * Unbinds a specific `handler` or all handlers from the
         * event of type `type`, either delegated from a descendant
         * or straight from `this.$element`.
         * 
         * `type` may also contain the `selector` argument in it,
         * separated by whitespace from the type. In such case, 
         * the second argument should be the `handler`.
         * 
         * @memberOf BaseWidget
         * @instance
         * @param {string} type - type of event to unbind.
         * @param {string} [selector] - query selector for filtering a descendant in case of unbinding event delegation. 
         * @param {function} handler - a reference to the handler function.
         * @returns {Widget}
         */
        unbind          : function (type, selector, handler) {
            var bind_args = parseTypeAndTarget(type);

            if ( bind_args.length === 1 || utils.isFunc(selector) )
                bind_args.push(selector);

            if ( bind_args.length < 3 && utils.isFunc(handler) ) 
                bind_args.push(handler);

            this.$element.off.apply(this.$element, bind_args);

            return this;
        },
        /**
         * Binds all DOM events that were initially in the instance's `config`
         * or were later attached using {@link BaseWidget#bind}.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */
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
        /**
         * Removes all attached DOM events that were initially in the
         * instance's `config` or were later attached using {@link BaseWidget#bind}.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */
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
        /**
         * Triggers selection (e.g. `click` event) on the given `target`.
         * `target` can be an `HTMLElement` or a query selector to be found
         * inside the instance's element.
         * It can also be a function that returns a wrapped element.
         * 
         * Related options:
         * * `click_event`: space separated event types to use for triggering selection. Defaults to {@link uijet.support.click_events.full}.
         * 
         * @memberOf BaseWidget
         * @instance
         * @param {function|string|HTMLElement} target - the target element to find or a function returning one.
         * @returns {Widget}
         */
        select          : function (target) {
            var event_type = this.options.click_event,
                $el;
            $el = utils.isFunc(target) ? target.call(this) : this.$element.find(target);
            utils.isFunc($el.trigger) && $el.trigger(event_type || uijet.support.click_events.full);
            return this;
        },
        /**
         * Sets `this.options` based on class's defaults and instance's
         * declaration.
         * 
         * @memberOf BaseWidget
         * @instance
         * @param {Object} options - options set in instance declaration's config. 
         * @returns {Widget}
         */
        setOptions      : function (options) {
            this.options = utils.extend(true, {}, this.options || {}, options);
            // make sure DOM events maps are initialized
            ! this.options.dom_events && (this.options.dom_events = {});
            ! this._bound_dom_events && (this._bound_dom_events = []);
            // make sure we have a `type_class` option set
            ! this.options.type_class && (this.options.type_class = DEFAULT_TYPE_CLASS);
            return this;
        },
        /**
         * Perform initialization tasks based on `this.options`.
         * 
         * Related options:
         * * `signals`: {@link BaseWidget#listen}s to each of the specified events.
         * * `dom_events`: prepares all specified DOM events for {@link BaseWidget#bind}ing.
         * * `app_events`: {@link BaseWidget#subscribe}s to each of the specified events.
         * * `wake_on_startup`: subscribes the instance to the `startup` event with a {@link BaseWidget#wake} call.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */
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
            // parse DOM events config for later binding on `wake()`
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
            return this;
        },
        /**
         * Sets `this.id`.
         * 
         * First attempts to check `options`, then falls back to the element's `id` attribute,
         * then to calling {@link BaseWidget#_generateId}.
         * 
         * Related options:
         * * `id`: the id to use.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */  
        setId           : function () {
            this.id = utils.returnOf(this.options.id, this) ||
                (this.$element && this.$element[0].id) ||
                this.setElement().$element[0].id ||
                this._generateId();
            return this;
        },
        /**
         * Sets `this.$element`.
         * 
         * Related options:
         * * `element`: the element to use as either query selector, element object, wrapped element, or a function returning one of the above.
         * 
         * @memberOf BaseWidget
         * @instance
         * @param {string|HTMLElement|HTMLElement[]} element - query selector, element, or wrapped element to use as the instance's element.
         * @returns {Widget}
         */  
        //TODO: allow the creation of the element outside the `document` when it doesn't exist in the DOM
        setElement      : function (element) {
            if ( element || ! this.$element ) {
                element = element || utils.returnOf(this.options.element, this);
                this.$element = utils.toElement(element);
            }
            return this;
        },
        /**
         * Removes the instance element (including wrapper) from the DOM.
         * If you wish to later insert it back to the DOM pass `true`
         * as the `reinsert` parameter. In such case the removed element
         * will be returned.
         * 
         * @memberOf BaseWidget
         * @instance
         * @param {boolean} [reinsert] - set to `true` if removed element is to be reinserted back to the DOM.
         * @returns {Widget|HtmlElement} - the removed element if `reinsert` is `true`, otherwise `this`.
         */
        //TODO: write a method that gets the top level element
        remove          : function (reinsert) {
            var el = (this.$wrapper || this.$center_wrapper || this.$element)[reinsert ? 'detach' : 'remove']();
            return reinsert ? el : this;
        },
        /**
         * Generates an id for the instance.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {string} - the generated id.
         * @private
         */
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
         * @memberOf BaseWidget
         * @instance
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
         * @memberOf BaseWidget
         * @instance
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
         * Related options:
         * * `horizontal`: controls size calculation - height of a single child element and width of all children 
         * when `true`, or vise versa if falsy.
         * 
         * @memberOf BaseWidget
         * @instance
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
         * @memberOf BaseWidget
         * @instance
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
         * This is done on {@link BaseWidget#init} and used to keep elements that
         * should not be touched when rendering the contents of the widget.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         * @private
         */
        _saveOriginal   : function () {
            ! this.$original_children && (this.$original_children = this.$element.children());
            return this;
        },
        /**
         * Removes all elements created by rendering the widget,
         * e.g. results from calling {@link BaseWidget#render}, meaning all that's *not* in
         * `$original_children`, set by {@link BaseWidget#_saveOriginal} on {@link BaseWidget#init}.
         * 
         * Related options:
         * * `extend_rendered`: set to `true` if you wish to keep the content with every render.
         * 
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         * @private
         */
        _clearRendered  : function () {
            if ( this.bound ) {
                this.unbindAll();
            }
            if ( ! this.options.extend_rendered ) {
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
         * @memberOf BaseWidget
         * @instance
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

    /**
     * Export the base {@link Widget} constructor.
     */
    return uijet.Base.derive(Widget);
}));
