// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        // for now we require jQuery
        define([
            'jquery',
            'uijet_dir/uijet',
            'eventbox',
            'director',
            'mustache'
        ], function ($, uijet, Ebox) {
            return (root.MyApp = factory($, uijet, Ebox, root));
        });
    } else {
        // if not using an AMD library set the global `uijet` namespace
        root.MyApp = factory(root.jQuery, root.uijet, root.Eventbox, root);
    }
}(this, function ($, uijet, Ebox, _window) {
    var Router = _window.Router().init(),
        BASE_PATH = '/',
        TEMPLATES_PATH = BASE_PATH + 'static_path/myapp/templates/',
        TEMPLATES_EXTENSION = 'ms',
        Mustache = _window.Mustache,
        MyApp;

    MyApp =  {
        AUTH                : '',
        ROUTES_SKIP_LIST    : ['/login/'],
        init            : function (options) {
            uijet.use({
                publish     : this.publish,
                subscribe   : this.subscribe,
                unsubscribe : this.unsubscribe,
                setRoute    : this.setRoute,
                unsetRoute  : this.unsetRoute,
                runRoute    : this.runRoute
            })
            .use({
                engine  : function () {
                    return Mustache.to_html(this.template, this.data || this.context, this.partials);
                }
            }, uijet.BaseWidget.prototype)
            .init({
                element             : '#main',
                route_prefix        : '/',
                route_suffix        : '/',
                animation_type      : 'fade',
                parse               : options.parse,
                widgets             : options.widgets,
                TEMPLATES_PATH      : TEMPLATES_PATH,
                TEMPLATES_EXTENSION : TEMPLATES_EXTENSION
            });

        },
        publish         : function (topic, data) {
            Ebox.notify(topic, data);
            return this;
        },
        subscribe       : function (topic, handler, context) {
            if ( context ) {
                if ( typeof handler == 'string' ) {
                    handler = context[handler];
                }
                Ebox.bind(context);
            }
            Ebox.listen(topic, handler);
            return this;
        },
        unsubscribe     : function (topic, handler) {
            Ebox.unlisten(topic, handler);
            return this;
        },
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
            if ( ! ~ MyApp.ROUTES_SKIP_LIST.indexOf(route) ) {
                MyApp.last_route = {
                    route   : route,
                    inner   : is_inner
                };
            }
            return this;
        }
    };

    return MyApp;
}));