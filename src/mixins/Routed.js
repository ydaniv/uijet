(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /*
     * If there's at least one `Routed` widget then allow all
     * other widgets to run routes.
     */
    /**
     * Extends {@link BaseWidget} with the ability to trigger routes.
     * 
     * @augments uijet.BaseWidget
     */
    uijet.use({
        /**
         * 
         * @param route
         * @param is_silent
         * @returns {*}
         */
        runRoute        : function (route, is_silent) {
            uijet.runRoute(route, is_silent);
            return this;
        }
    }, uijet.BaseWidget.prototype);

    /**
     * Routed mixin class.
     * 
     * @class Routed
     * @extends uijet.BaseWidget
     */
    uijet.Mixin('Routed', {
        routed          : true,
        /**
         * Ensures registered routes are unregistered.
         * 
         * @memberOf Routed
         * @instance
         * @returns {Routed}
         */
        destroy         : function () {
            this.notify(true, 'pre_destroy');
            this.unregisterRoutes()
                ._super.apply(this, arguments);
            return this;
        },
        /**
         * Ensures routes get registered.
         * 
         * @memberOf Routed
         * @instance
         * @returns {Routed}
         */
        register        : function () {
            // register all routes
            this._super()
                .registerRoutes();
            return this;
        },
        /**
         * Registers all routes.
         * 
         * #### Related options:
         * 
         * * `alias_routes`: list of additional routes that will be registered as alias of this instance's route.
         * 
         * @returns {*}
         */
        registerRoutes  : function () {
            var _aliases = this.options.alias_routes;
            // register the route set as the `route` option
            this.setRoute();
            // set the alias routes
            if ( _aliases && _aliases.length ) {
                for ( var i = 0, a; a = _aliases[i++]; ) uijet.setRoute(this, a);
            }
            return this;
        },
        /**
         * Unregisters all routes.
         * 
         * #### Related options:
         * 
         * * `alias_routes`: all aliases registered with this instance that will be unregistered.
         * 
         * @memberOf Routed
         * @instance
         * @returns {Routed}
         */
        unregisterRoutes: function () {
            var _aliases = this.options.alias_routes;
            // register the route set as the `route` option
            this.unsetRoute();
            // set the alias routes
            if ( _aliases && _aliases.length ) {
                for ( var i = 0, a; a = _aliases[i++]; ) this.unsetRoute(a);
            }
            return this;
        },
        /**
         * Unregisters current route and registers a new one, if `route` is provided.
         * If `route` is falsy it defaults to the `route_prefix` and `route_sufix`
         * uijet options surrounding `this.id`.
         * 
         * @memberOf Routed
         * @instance
         * @param {string} [route] - new route to register.
         * @returns {Routed}
         */
        //TODO: implement replacing a current route and setting another route (alias) separately
        setRoute        : function (route) {
            var _ops_route = this.options.route;
            if ( route ) {
                if ( _ops_route ) {
                    this.unsetRoute(_ops_route)
                        .options.route = route;
                } else {
                    this.options.route =  route;
                }
            } else if ( ! _ops_route ) {
                // create a default route and store it
                this.options.route = uijet.route_prefix + this.id + uijet.route_suffix;
            }
            uijet.setRoute(this);
            return this;
        },
        /**
         * Unregisters the route `route` or the current registered one (not aliases).
         * 
         * @memberOf Routed
         * @instance
         * @param {string} [route] - route to unregister.
         * @returns {Routed}
         */
        unsetRoute      : function (route) {
            route = route || this.getRoute();
            uijet.unsetRoute(this, route);
            return this;
        },
        /**
         * Gets the current default route that's currently registered with this instance.
         * 
         * @memberOf Routed
         * @instance
         * @returns {string} - current default route that's currently registered with this instance.
         */
        getRoute        : function () {
            return this.options.route;
        }
    });
}));
