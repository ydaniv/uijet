// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Routed', {
        routed          : true,
        wake            : function (context, by_route) {
            if ( by_route ) {
                // enable waking logic to run
                this.awake = false;
                // continue with original waking
                return this._super(context);
            }
            // it's not a specific call for this widget so it's the container's context
            this.container_context = context;
            return this._super();
        },
        destroy         : function () {
            this.notify(true, 'pre_destroy');
            this.unregisterRoutes()
                ._super();
            return this;
        },
        register        : function () {
            // register all routes
            this._super()
                .registerRoutes();
            return this;
        },
        // ### widget.registerRoutes
        // @sign: registerRoutes()  
        // @return: this
        // 
        // Register the premier route.  
        // Registers all alias routes using the `alias_routes` option.
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
        // ### widget.unregisterRoutes
        // @sign: unregisterRoutes()  
        // @return: this
        // 
        // Unregister the premier route and all alias routes.
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
        // ### widget.checkState
        // @sign: checkState()  
        // @return: this
        //
        // Checks whether the `data-uijet-state` attribute is set on `$element` and it is 'current'.  
        // If it is it sets the `state` option to that `String`.
        checkState      : function () {
            var state = this.$element.attr('data-uijet-state');
            if ( state == 'current' ) {
                this.options.state = state;
            }
            return this;
        },
        // ### widget.setRoute
        // @sign: setRoute([route])  
        // @return: this
        //
        // Sets the `route` option and then registers it with the router via the sandbox.  
        // If `route` argument is supplied as a `String` it uses it.  
        // If `route` option is already set then unset it and set again with the new.  
        // If no arguments and `route` option is not set then it is set to `this.id`, prefixed by `uijet.route_prefix`
        // and suffixed by `uijet.route_suffix`.  
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
        // ### widget.unsetRoute
        // @sign: unsetRoute([route])  
        // @return: this
        //
        // Unsets a registered route of a widget.
        // If `route` is supplied it attempts to unset that specific route.  
        // If it isn't, it calls `getRoute` and attempts to unset that route.  
        // Hooks into `uijet.unsetRoute`.
        unsetRoute      : function (route) {
            route = route || this.getRoute();
            uijet.unsetRoute(this, route);
            return this;
        },
        // ### widget.getRoute
        // @sign: getRoute()  
        // @return: route
        //
        // Gets the widget's `route` option.
        getRoute        : function () {
            return this.options.route;
        },
        // ### widget.run
        // @sign: run([context])  
        // @return: this
        //
        // Used as a callback from a route to `wake` up a widget, sending it the `context` object
        // of params from the URL.
        run             : function (context) {
            this.notify(true, 'pre_run', context);
            this.wake(context, true);
            return this;
        }
    });
}));