define([
    'jquery',
    'uijet_dir/uijet',
    'sammy',
    'mustache'
], function ($, uijet) {

    var _window = window,
        Sammy = _window.Sammy,
        BASE_PATH = '/',
        TEMPLATES_PATH = BASE_PATH + 'static/myapp/templates/',
        TEMPLATES_EXTENSION = 'ms',
        Mustache = _window.Mustache,
        MyApp;


    uijet.context = {};
    uijet.Adapter({
        _setContext : function () {
            if ( arguments.length ) {
                this.context = arguments[0] && arguments[0].params ||
                    arguments[0] || this.context;
                uijet.context[this.id] = this.context; // cache the result in the app
            }
            return this;
        }
    });

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

            uijet.init({
                element             : '#main',
                route_prefix        : '#/',
                route_suffix        : '/',
                animation_type      : 'fade',
                widgets             : options.widgets,
                engine              : function () {
                    return Mustache.to_html(this.template, this.data || this.context);
                },
                methods_context     : this,
                methods             : {
                    publish     : this.publish,
                    subscribe   : this.subscribe,
                    unsubscribe : this.unsubscribe,
                    setRoute    : this.setRoute,
                    unsetRoute  : this.unsetRoute,
                    runRoute    : this.runRoute
                },
                TEMPLATES_PATH      : TEMPLATES_PATH,
                TEMPLATES_EXTENSION : TEMPLATES_EXTENSION,
                pre_startup         : function () {
                    that.startup()
                }
            });
        },
        startup         : function () {
            this.app.run(uijet.getCurrentView().getRoute());
            return this;
        },
        publish         : function (topic, data) {
            this.app.trigger(topic, data);
            return this;
        },
        subscribe       : function (topic, handler, context) {
            if ( context ) {
                if ( typeof handler == 'string' ) {
                    handler = context[handler];
                }
                handler = handler.bind(context);
            }
            this.app.bind(topic, handler);
            return this;
        },
        unsubscribe     : function (topic, handler) {
            this.app._unlisten(topic, handler);
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
            this.app[method](route || widget.getRoute(), function (context) {
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
            _route = this.app.lookupRoute(method, route || widget.getRoute());
            if ( _route ) {
                _routes = this.app.routes[method];
                for ( var l = _routes.length; l-- ; ) {
                    if ( _route === _routes[l] ) {
                        _routes.splice(l, 1);
                    }
                }
            }
            return this;
        },
        runRoute        : function (route, is_inner) {
            is_inner ? this.app.runRoute('get', route) : this.app.setLocation(route);
            if ( ! ~ this.ROUTES_SKIP_LIST.indexOf(route) ) {
                this.last_route = {
                    route   : route,
                    inner   : is_inner
                };
            }
            return this;
        }
    };

    return MyApp;
});