// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'sammy'], function (uijet) {
            return factory(uijet);
        });
    } else {
        root.uijet.router = factory(uijet);
    }
}(this, function (uijet) {
    return function (app) {
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
                app[method](route || widget.getRoute(), function (context) {
                    context = context ? context : context.params;
                    callback.call(widget, context);
                });
                return this;
            },
            unsetRoute      : function (widget, route) {
                var method = 'get', _route, _routes;
                if ( uijet.Utils.isObj(route) ) {
                    method = route.method;
                    route = route.path;
                }
                _route = app.lookupRoute(method, route || widget.getRoute());
                if ( _route ) {
                    _routes = app.routes[method];
                    for ( var l = _routes.length; l-- ; ) {
                        if ( _route === _routes[l] ) {
                            _routes.splice(l, 1);
                        }
                    }
                }
                return this;
            },
            runRoute        : function (route, is_inner) {
                is_inner ? app.runRoute('get', route) : app.setLocation(route);
                return this;
            }
        });
    };
}));