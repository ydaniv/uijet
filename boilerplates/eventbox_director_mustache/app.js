// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        // for now we require jQuery
        define([
            'jquery',
            'uijet_dir/uijet',
            'uijet_dir/modules/pubsub/eventbox',
            'uijet_dir/modules/router/director',
            'uijet_dir/modules/engine/mustache'
        ], function ($, uijet, engine, pubsub, router) {
            return (root.MyApp = factory($, uijet, engine, pubsub, router, root));
        });
    } else {
        // if not using an AMD library set the global `uijet` namespace
        root.MyApp = factory(root.jQuery, root.uijet, root.uijet_engine, root.uijet_pubsub, root.uijet_router, root);
    }
}(this, function ($, uijet, engine, pubsub, router, _window) {
    var BASE_PATH = '/',
        TEMPLATES_PATH = BASE_PATH + 'static_path/myapp/templates/',
        TEMPLATES_EXTENSION = 'ms',
        // plugging in template engine
        Mustache = engine(),
        MyApp;

    MyApp =  {
        AUTH                : '',
        ROUTES_SKIP_LIST    : ['/login/'],
        init            : function (options) {
                // plugging in pubsub
            var Ebox = pubsub(this),
                // plugging in router
                Router = router(null, this);

            uijet.init({
                element             : '#main',
                route_prefix        : '/',
                route_suffix        : '/',
                animation_type      : 'fade',
                parse               : options.parse,
                widgets             : options.widgets,
                TEMPLATES_PATH      : TEMPLATES_PATH,
                TEMPLATES_EXTENSION : TEMPLATES_EXTENSION
            });
        }
    };

    return MyApp;
}));