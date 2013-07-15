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

    return function (router) {
        var Router = router instanceof Backbone.Router ? router : new Backbone.Router(router);

        uijet.use({
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
                    callback = widget.run;
                }

                Router.route(route, name, function () {
                    var context = uijet.buildContext(route, arguments);
                    callback.call(widget, context);
                });

                return this;
            },
            unsetRoute  : function (widget, route) {
                var r;
                for ( r in Router ) {
                    if ( r === route ) {
                        Router.off('route:' + Router[r]);
                        delete Router[r];
                    }
                }
                return this;
            },
            runRoute    : function (route) {
                Backbone.history.loadUrl(route);
                return this;
            },
            navigate    : Router.navigate.bind(Router)
        });

        return Router;
    };
}));
