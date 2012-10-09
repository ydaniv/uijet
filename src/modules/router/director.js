// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'director'], function (uijet) {
            return factory(uijet, root);
        });
    } else {
        uijet.router = factory(uijet, root);
    }
}(this, function (uijet, root) {
    return function (router) {
        var Router;
        if ( router ) {
            Router = router;
        }
        else {
            Router = root.Router().init();
        }
        uijet.use({
            setRoute        : function (widget, route, callback) {
                var method = 'get';
                if ( uijet.Utils.isObj(route) ) {
                    method = route.method;
                    route = route.path;
                }
                if ( typeof callback == 'string' && widget[callback] ) {
                    callback =  widget[callback];
                }
                if ( typeof callback != 'function' ) {
                    callback = widget.run
                }
                route = route || widget.getRoute();
                Router.on(route, function () {
                    var context = uijet.buildContext(route, arguments);
                    callback.call(widget, context);
                });
                return this;
            },
            unsetRoute      : function (widget, route) {
                //TODO: TBD
                return this;
            },
            runRoute        : function (route, is_inner) {
                is_inner ? Router.dispatch('on', route) : Router.setRoute(route);
                return this;
            }
        });

        return Router;
    };
}));