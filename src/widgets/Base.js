(function (root, factory) {
    // set the BaseWidget class with the returned constructor function
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return (uijet.BaseWidget = factory(uijet));
        });
    }
    else {
        root.uijet.BaseWidget = factory(root.uijet);
    }
}(this, function (uijet) {

    var utils = uijet.utils,
        /**
         * Constructor for the base widget class.
         *
         * @constructor
         * @class Widget
         * @alias BaseWidget
         * @category Widget
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

    /*
     * Public, inheritable methods of {@link Widget} class.
     */
    Widget.prototype = {
        constructor     : Widget,
        /**
         * Initializes a widget instance and returns a list
         *
         * A *lifecycle method*, does all the possible lifting that can be done
         * before awaking/rendering.
         *
         * `init()` is invoked by uijet when it is `init()`ed itself
         * or when you `start()` a widget ad-hoc.
         *
         * #### Signals:
         *
         * * `post_init`: triggered at the end of this method.
         *
         * #### Related options:
         *
         * * `bind_on_wake`: unless `true` all `dom_events` will be bound to the `this.$element` at the
         * end of this method and before `post_init` signal is triggered.
         *
         * @memberOf BaseWidget
         * @instance
         * @param {Object} options - config object for the widget.
         * @returns {Promise[]|undefined}
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
                .prepareElement();

            // init contained components
            var contained_starts = this.initContained();

            if ( !this.options.bind_on_wake ) {
                // bind DOM events
                this.bindAll();
            }

            this.notify(true, 'post_init');

            return contained_starts;
        },
        /**
         * Initializes contained widget instances.
         * Returns a Promise or `undefined` if the
         * `components` option is not set.
         *
         * If the `container` option of the contained widgets is not
         * set, it will be automatically set to the `id` of this widget.
         *
         * #### Related options:
         *
         * * `components`: list of contained components to init.
         *
         * @memberOf BaseWidget
         * @instance
         * @returns {Promise|undefined}
         */
        initContained   : function () {
            var container_id = this.id,
                contained;
            if ( contained = utils.returnOf(this.options.components, this) ) {
                contained.forEach(function (child) {
                    if ( !child.config.container ) {
                        child.config.container = container_id;
                    }
                });
                return uijet.start(contained);
            }
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
         * Sets properties on the contained components of this widget.
         * This effect will continue to propagate recursively.
         *
         * @memberOf BaseWidget
         * @instance
         * @param {object} [context] - a map of properties to send to contained widgets to set on their `context`.
         * Defaults to the result of `this.getContext()`.
         * @returns {Widget}
         */
        trickle         : function (context) {
            uijet._trickle(this, context);
            return this;
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
         * #### Signals:
         *
         * * `pre_wake`: triggered before waking of contained widgets, takes `wake()`'s `context` param as argument.
         * If it returns `false` the instance will not call {@link BaseWidget#render}.
         * * `post_wake`: triggered at the end of a successful wake, takes `wake()`'s `context` param as argument.
         * * `wake_failed`: triggered at the end of a failed wake, takes all arguments of the rejected {@link BaseWidget#wakeContained},
         * or `render()` call. If it returns a truthy value `wake()` will be invoked again, otherwise `sleep()`.
         *
         * #### Related options:
         *
         * * `sync`: when `true` a successful starting sequence will only begin once all promises returned by `wake()` calls
         * of all child components are resolved. Otherwise, will start immediately.
         * * `bind_on_wake`: if `true` all `dom_events` will be bound to the `this.$element` on every wake.
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
            if ( this.awake && !context ) {
                return this._finally();
            }
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
            fail = this._deactivate.bind(this, context);

            // final activation once all is ready
            activate = this._activate.bind(this, context);

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
            return uijet._wakeContained(this, context);
        },
        /**
         * Stops a started widget.
         * A *lifecycle method*, hides the widget and removes all
         * DOM events from it.
         * Every contained widget will also be stopped and this
         * will continue trickling down recursively.
         *
         * #### Related options:
         *
         * * `destroy_on_sleep`: if `true` this widget will self destruct when put to sleep.
         *
         * #### Signals:
         *
         * * `pre_sleep`: triggered at the beginning of this instance is awake.
         * * `post_sleep`: triggered at the end of this instance is awake.
         * * `bind_on_wake`: if `true` all `dom_events` will be unbound from the `this.$element` on every sleep.
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
                if ( this.options.bind_on_wake ) {
                    // unbind DOM events
                    this.unbindAll();
                }
                //TODO: need to wrap with uijet.when() since disappear() might be async
                // hide
                this.disappear(no_transitions)
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
            uijet._sleepContained(this);
            return this;
        },
        /**
         * Cleans up all related DOM, memory and events related to
         * this instance.
         * A *lifecycle method*, destroys the instance and all its contained widgets.
         *
         * #### Signals:
         *
         * * `pre_destroy`: triggered at the beginning.
         *
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         */
        destroy         : function () {
            this.notify(true, 'pre_destroy');
            // perform a recursive destruction down the widget tree
            this.destroyContained.apply(this, arguments);
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
            var args = utils.toArray(arguments);
            args.unshift(this);
            uijet._destroyContained.apply(uijet, args);
            return this;
        },
        /**
         * Initializes the instance's element.
         *
         * #### Related options:
         *
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
                position;
            this.options.extra_class && (classes += ' ' + this.options.extra_class);
            this.$element.addClass(classes);
            // check if inside DOM
            if ( el.ownerDocument.body.contains(el) ) {
                position = utils.returnOf(this.options.position, this);
                position && this.position(position);
            }
            return this;
        },
        /**
         * Minimal version of {@link extension/position#position} that only
         * handles the value `'center'` for the `position` option for centering
         * an instance's element.
         *
         * This method will always attempt to {@link BaseWidget#_wrap} the instance's element.
         *
         * @memberOf BaseWidget
         * @instance
         * @param {string} position - directives for positioning the instance's container element.
         * @returns {Widget}
         */
        position        : function (position) {
            this._wrap();

            if ( typeof position == 'string' ) {
                if ( position == 'center' ) {
                    this._center();
                }
            }
            return this;
        },
        /**
         * Placeholder for rendering logic.
         *
         * #### Signals:
         *
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
         * #### Signals:
         *
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
         * #### Signals:
         *
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

            if ( bind_args.length === 1 || utils.isFunc(selector) ) {
                bind_args.push(selector);
            }

            if ( bind_args.length < 3 && utils.isFunc(handler) ) {
                bind_args.push(handler);
            }

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
            for ( n in this._bound_dom_events ) {
                this.$element.on.apply(this.$element, this._bound_dom_events[n]);
            }

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
                for ( n in this._bound_dom_events ) {
                    this.$element.off.apply(this.$element, this._bound_dom_events[n]);
                }
            }
            this.bound = false;
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
            !this.options.dom_events && (this.options.dom_events = {});
            !this._bound_dom_events && (this._bound_dom_events = []);
            // make sure we have a `type_class` option set
            !this.options.type_class && (this.options.type_class = DEFAULT_TYPE_CLASS);
            // make sure we have `components` option set
            !this.options.components && (this.options.components = []);
            return this;
        },
        /**
         * Perform initialization tasks based on `this.options`.
         *
         * #### Related options:
         *
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
                this.subscribe('startup', function () {
                    this.wake();
                });
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
         * #### Related options:
         *
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
         * #### Related options:
         *
         * * `element`: the element to use as either query selector, element object, wrapped element, or a function returning one of the above.
         *
         * @memberOf BaseWidget
         * @instance
         * @param {string|HTMLElement|HTMLElement[]} element - query selector, element, or wrapped element to use as the instance's element.
         * @returns {Widget}
         */
        //TODO: allow the creation of the element outside the `document` when it doesn't exist in the DOM
        setElement      : function (element) {
            if ( element || !this.$element ) {
                element = element || utils.returnOf(this.options.element, this);
                this.$element = utils.toElement(element);
                if ( ! this.$element.length ) {
                    throw new Error('No element created or found for: ' + this.options.element);
                }
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
         * Completes the waking sequence by activating and showing
         * the instance.
         * This is a the fulfilled handler of `wake()`.
         *
         * #### Signals:
         *
         * * `post_wake`: triggered at the end of a successful wake, takes `wake()`'s `context` param as argument.
         *
         * @memberOf BaseWidget
         * @instance
         * @param {*} [context] - the context argument passed to {@link BaseWidget#wake}.
         * @returns {*} - the result of calling `appear()`, which could be a `Promise`.
         * @private
         */
        _activate       : function (context) {
            var appearance;
            // there was context to change but if we're set then bail out
            if ( !this.awake ) {
                if ( this.options.bind_on_wake ) {
                    // bind DOM events
                    this.bindAll();
                }
                //TODO: need to wrap with uijet.when() since appear() might be async
                // show it
                appearance = this.appear();
                this.awake = true;
            }
            this.notify(true, 'post_wake', context);
            this._finally();
            // in case there's an animation on `appear()`
            return appearance;
        },
        /**
         * Completes the waking sequence of a broken waking sequence.
         * This is a the rejected handler of `wake()`.
         *
         * If `wake_failed` returns a truthy result it's passed to another call to
         * `wake()`, and another attempt will be made.
         * If not, `sleep()` is called and the `reason` is returned in a subsequent
         * rejected `Promise`, and the widgets branch will continue to fold back.
         *
         * #### Signals:
         *
         * * `wake_failed`: triggered at the beginning, takes all arguments of the rejected {@link BaseWidget#wakeContained},
         * or `render()` call.
         *
         * @memberOf BaseWidget
         * @instance
         * @param {*} context - the context argument passed to {@link BaseWidget#wake}.
         * @param {*} reason - the rejection reason.
         * @returns {*} - the result of another call to `wake()` or a rejected `Promise`.
         * @private
         */
        _deactivate     : function (context, reason) {
            var new_context;
            // notify failure signal
            if ( new_context = this.notify.apply(this, [
                true, 'wake_failed'
            ].concat(Array.prototype.slice.call(arguments))) ) {
                // if user asked to retry the wake again
                return this.wake(new_context);
            }
            else {
                this.sleep();
                return uijet.reject(reason);
            }
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
            var id = utils.toArray(this.options.type_class)
                         .splice(-1, 1).toString()
                         .replace('uijet_', '') + '_' + (++widget_id_index);
            this.$element[0].setAttribute('id', id);
            return id;
        },
        /**
         * Utility for wrapping the widget's element in a container element.
         *
         * #### Related options:
         *
         * * `dont_wrap`: skips wrapping and sets `$wrapper` to `$element`.
         * * `wrapper_class`: extra class names to be set on the container element.
         * * `wrapper_tag`: a name of a tag to use for the container element. Defaults to `div`.
         * * `cloak`: if this instance is cloaked, hiding is transferred to the container.
         * * `hide`: if this instance is hidden, hiding is transferred to the container.
         *
         * @memberOf BaseWidget
         * @instance
         * @returns {Widget}
         * @private
         */
        _wrap           : function () {
            var classes;
            if ( !this.$wrapper ) {
                if ( this.options.dont_wrap ) {
                    this.$wrapper = this.$element;
                }
                else {
                    classes = 'uijet_wrapper ' + utils.toArray(this.options.type_class).join('_wrapper ') + '_wrapper';
                    this.options.wrapper_class && (classes += ' ' + this.options.wrapper_class);
                    // wrap and cache the wrapper
                    this.$wrapper = this.$element.wrap(uijet.$('<' + (this.options.wrapper_tag || 'div') + '>', {
                        'class': classes,
                        id     : this.id + '_wrapper'
                    })).parent();

                    if ( this.options.cloak || this.options.hide ) {
                        this._setCloak(true);
                        if ( this.options.hide ) {
                            this.$element.removeClass('hide');
                        }
                        else {
                            this.$element[0].style.removeProperty('visibility');
                        }
                    }
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
            if ( !this.$center_wrapper ) {
                this.$wrapper.addClass('center');
                // wrap and cache the wrapper
                this.$center_wrapper = this.$element.wrap(uijet.$('<div/>', {
                    'class': 'uijet_center_wrapper ' +
                             utils.toArray(this.options.type_class).join('_center_wrapper ') +
                             '_center_wrapper'
                })).parent();
            }
            return this;
        },
        /**
         * Toggles the element's `visibility`, depending on the `cloak` argument.
         * If the `hide` option is truthy it will toggle the `hide` class instead,
         * based on the `cloak` argument.
         *
         * Used for hiding the widget from view while it is asleep.
         *
         * If `cloak` is truthy the element will be hidden and otherwise shown.
         * The `hide` class is located in the uijet's stylesheets in `layout.less`.
         *
         * #### Related options:
         *
         * * `hide`: if truthy this method will toggle the `hide` class.
         * * `cloak`: if truthy, and `hide` option is falsy, this method will toggle the `visibility` style attribute of this element.
         *
         * @memberOf BaseWidget
         * @instance
         * @param {boolean} [cloak] - whether to cloak the element.
         * @returns {Widget}
         * @private
         */
        _setCloak       : function (cloak) {
            if ( this.options.hide ) {
                (this.$wrapper || this.$element).toggleClass('hide', !!cloak);
            }
            else if ( this.options.cloak ) {
                (this.$wrapper || this.$element)[0].style.visibility = cloak ? 'hidden' : 'visible';
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
            return this;
        }
    };

    /*
     * Export the base {@link Widget} constructor.
     */
    return uijet.Base.derive(Widget);
}));
