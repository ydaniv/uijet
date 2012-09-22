// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        // for now we require jQuery
        define([
            'jquery',
            'uijet_dir/uijet',
            'sammy',
            'mustache'
        ], function ($, uijet) {
            return (root.MyApp = factory($, uijet, root));
        });
    } else {
        // if not using an AMD library set the global `uijet` namespace
        root.MyApp = factory(root.jQuery, root.uijet, root);
    }
}(this, function ($, uijet, _window) {
    var _window = window,
        Sammy = _window.Sammy,
        BASE_PATH = '/',
        TEMPLATES_PATH = BASE_PATH + 'static_path/myapp/templates/',
        TEMPLATES_EXTENSION = 'ms',
        Mustache = _window.Mustache,
        MyApp;

    MyApp =  {
        AUTH            : '',
        ROUTES_SKIP_LIST: ['#/login/'],
        init            : function (options) {
            var that = this;

            this.app = Sammy('#main', function (app) {
                // #### Sammy app code here
            });

            this.options = options;
            if ( options.templates_path ) {
                TEMPLATES_PATH = BASE_PATH + options.templates_path;
            }

            uijet.use({
                publish     : this.publish,
                subscribe   : this.subscribe,
                unsubscribe : this.unsubscribe,
                setRoute    : this.setRoute,
                unsetRoute  : this.unsetRoute,
                runRoute    : this.runRoute
            })
            .use({
                engine              : function () {
                    return Mustache.to_html(this.template, this.data || this.context, this.partials);
                }
            }, uijet.BaseWidget.prototype)
            .init({
                element             : '#main',
                route_prefix        : '#/',
                route_suffix        : '/',
                animation_type      : 'fade',
//                submit_handled      : true, // Uncomment this line to allow Sammy to capture form submission
                widgets             : options.widgets,
                TEMPLATES_PATH      : TEMPLATES_PATH,
                TEMPLATES_EXTENSION : TEMPLATES_EXTENSION,
                pre_startup         : function () {
                    // since Sammy needs the app to be run before events can start work we use
                    // this signal to make sure the app is running
                    that.startup()
                }
            });
        },
        startup         : function () {
            this.app.run(uijet.getCurrentView().getRoute());
            return this;
        },
        publish         : function (topic, data) {
            MyApp.app.trigger(topic, data);
            return this;
        },
        subscribe       : function (topic, handler, context) {
            if ( context ) {
                if ( typeof handler == 'string' ) {
                    handler = context[handler];
                }
                handler = handler.bind(context);
            }
            MyApp.app.bind(topic, handler);
            return this;
        },
        unsubscribe     : function (topic, handler) {
            MyApp.app._unlisten(topic, handler);
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
            MyApp.app[method](route || widget.getRoute(), function (context) {
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
            _route = MyApp.app.lookupRoute(method, route || widget.getRoute());
            if ( _route ) {
                _routes = MyApp.app.routes[method];
                for ( var l = _routes.length; l-- ; ) {
                    if ( _route === _routes[l] ) {
                        _routes.splice(l, 1);
                    }
                }
            }
            return this;
        },
        runRoute        : function (route, is_inner) {
            is_inner ? MyApp.app.runRoute('get', route) : MyApp.app.setLocation(route);
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