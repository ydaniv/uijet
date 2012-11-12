// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/modules/dom/jquery',
            'uijet_dir/modules/pubsub/eventbox',
            'uijet_dir/modules/promises/jquery',
            'uijet_dir/modules/xhr/jquery'
        ], function (uijet, $, Ebox) {
            return (root.MyApp = factory(uijet, $, Ebox, root));
        });
    } else {
        // if not using an AMD library set the global `uijet` namespace
        root.MyApp = factory(root.uijet, root.jQuery, root.uijet_pubsub, root);
    }
}(this, function (uijet, $, Ebox, _window) {
    var TEMPLATES_PATH = '/static_path/myapp/templates/',
        TEMPLATES_EXTENSION = 'ms',
        MyApp;

    MyApp =  {
        init            : function (options) {
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