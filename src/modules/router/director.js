(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'director'], function (uijet) {
            return factory(uijet, root);
        });
    } else {
        uijet.router = factory(uijet, root);
    }
}(this, function (uijet, root) {
    /**
     * Router adapter for the Director router.
     * 
     * @module module:router/director
     * @extends uijet
     * @see {@link https://github.com/flatiron/director|Director}
     * @param {Object} router - an instance of `Router` or a config object for its initialization.
     * @param {Object} [config] - configuration object for {@link https://github.com/flatiron/director#configuration|`Router.configure`}.
     * @param {string} [initial] - initial route to redirect to {@link https://github.com/flatiron/director#initredirect|`Router.init(redirect)`}.
     * @exports module:router/director
     */
    return function (router, config, initial) {
        var _router = router instanceof root.Router ? router : new root.Router(router);

        if ( config && typeof config == 'object' ) {
            _router.configure(config);
        }

        if ( ! _router.handler ) {
            if ( typeof config == 'string' ) {
                initial = config;
            }
            _router.init(initial);
        }

        uijet.use({
            /**
             * Registers a route to be handled by a given `Routed` `widget` instance.
             *
             * @method module:router/director#setRoute
             * @param {Object} widget - the widget instance that will intercept this route.
             * @param {string} [route] - the route to register to. Defaults to calling `widget.getRoute()`.
             * @param {string|function} [callback] - key that can be parsed to a handler, widget method,
             * signal or event to publish, or a function, to use as callback for the route. Defaults to the `widget`'s `wake()`.
             * @returns {uijet}
             * @see {@link https://github.com/flatiron/director#adhoc-routing|Adhoc Routing}
             */
            setRoute        : function (widget, route, callback) {
                if ( uijet.utils.isObj(route) ) {
                    route = route.path;
                }

                callback =  widget._parseHandler(callback);

                if ( typeof callback != 'function' ) {
                    callback = widget.wake;
                }

                route = route || widget.getRoute();

                _router.on(route, function () {
                    var context = uijet.buildContext(route, arguments);
                    callback.call(widget, context);
                });

                return this;
            },
            unsetRoute      : function (widget, route) {
                //TODO: make a PR to flatiron/director with this feature
                //TODO: TBD
                return this;
            },
            /**
             * Executes a handler for a given `route`.
             * 
             * @method module:router/director#runRoute
             * @param {string} route - the route to match for a handler to execute.
             * @param {boolean} [is_silent] - if `true` just triggers the handler. Otherwise sets the given `route`
             * in the browser's addressbar.
             * @returns {uijet}
             * @see {@link http://backbonejs.org/docs/backbone.html#section-195|Backbone.History#loadUrl}
             */
            runRoute        : function (route, is_silent) {
                is_silent ? _router.dispatch('on', route) : _router.setRoute(route);
                return this;
            }
        });

        return _router;
    };
}));
