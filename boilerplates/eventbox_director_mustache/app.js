// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/modules/dom/jquery',
            'uijet_dir/modules/engine/mustache',
            'uijet_dir/modules/router/director',
            'uijet_dir/modules/pubsub/eventbox',
            'uijet_dir/modules/promises/jquery',
            'uijet_dir/modules/xhr/jquery'
        ], function (uijet, $, Mustache, router, Ebox) {
            return (root.MyApp = factory(uijet, $, Mustache, router, Ebox, root));
        });
    } else {
        // if not using an AMD library set the global `uijet` namespace
        root.MyApp = factory(root.uijet, root.jQuery, root.Mustache, root.Eventbox, root.uijet_pubsub, root);
    }
}(this, function (uijet, $, Mustache, router, Ebox, _window) {
    var TEMPLATES_PATH = '/static_path/myapp/templates/',
        TEMPLATES_EXTENSION = 'ms',
        MyApp;

    MyApp =  {
        init            : function (options) {
            // plugging in router
            var Router = router();

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