(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'backbone'
        ], function (uijet, Backbone) {
            return factory(uijet, Backbone);
        });
    } else {
        uijet.router = factory(uijet, root.Backbone);
    }
}(this, function (uijet, Backbone) {

    /**
     * Router adapter for the Backbone.js router
     * 
     * @module modules/router/backbone
     * @augments uijet
     * @see {@link http://http://backbonejs.org/#Router|Backbone.Router}
     * @param {Object} router - an instance of the Backbone.Router or a config object for its initialization.
     */
    return function (router) {
        var Router = router instanceof Backbone.Router ? router : new Backbone.Router(router);

        
        uijet.use({
            /**
             * Registers a route to be handled by a given `Routed` `widget` instance.
             *
             * @instance
             * @param {Object} widget - the widget instance that will intercept this route.
             * @param {string} [route] - the route to register to. Defaults to calling `widget.getRoute()`.
             * @param {string|function} [callback] - key that maps to a method of the widget or the router, or a function,
             * to use as callback for the route. Defaults to the `widget`'s `wake()`.
             * @returns {uijet}
             * @see {@link http://backbonejs.org/#Router|Backbone.Router#route}
             */
            setRoute    : function (widget, route, callback) {
                var name;
                route = route || widget.getRoute();

                if ( typeof callback == 'string' ) {
                    name = callback;

                    if ( callback in widget )
                        callback =  widget[callback];

                    else if ( callback in Router )
                        return Router.route(route, name), this;

                }

                if ( typeof callback != 'function' ) {
                    callback = widget.wake;
                }

                Router.route(route, name, function () {
                    var context = uijet.buildContext(route, arguments);
                    callback.call(widget, context);
                });

                return this;
            },
            /**
             * Removes a registered route.
             * 
             * @instance
             * @param {string} route - a route that is registered on the router.
             * @returns {uijet}
             * @see {@link http://backbonejs.org/#Router|Backbone.Router#off}
             */
            unsetRoute  : function (route) {
                var r;
                for ( r in Router ) {
                    if ( r === route ) {
                        Router.off('route:' + Router[r]);
                        delete Router[r];
                    }
                }
                return this;
            },
            /**
             * Executes a handler for a given `route`.
             * 
             * @instance
             * @param {string} route - the route to execute.
             * @returns {uijet}
             * @see {@link http://backbonejs.org/docs/backbone.html#section-195|Backbone.History#loadUrl}
             */
            runRoute    : function (route) {
                Backbone.history.loadUrl(route);
                return this;
            },
            /**
             * Delegates to the Backbone Router's `navigate()`.
             * 
             * @instance
             * @returns {uijet}
             * @see {@link http://http://backbonejs.org/#Router-navigate|Backbone.Router#navigate}
             */
            navigate    : function () {
                Router.navigate.apply(Router, arguments);
                return this;
            }
        });

        return Router;
    };
}));
