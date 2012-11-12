// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/modules/dom/jquery',
            'uijet_dir/modules/engine/mustache',
            'uijet_dir/modules/pubsub/sammy',
            'uijet_dir/modules/router/sammy',
            'uijet_dir/modules/promises/jquery',
            'uijet_dir/modules/xhr/jquery'
        ], function (uijet, $, Mustache, pubsub, router) {
            return (root.MyApp = factory(uijet, $, Mustache, pubsub, router, root));
        });
    } else {
        // if not using an AMD library set the global `uijet` namespace
        root.MyApp = factory(root.uijet, root.jQuery, root.Mustache, root.uijet_pubsub, root.uijet_router, root);
    }
}(this, function (uijet, $, Mustache, pubsub, router, _window) {
    var Sammy = _window.Sammy,
        TEMPLATES_PATH = '/static_path/myapp/templates/',
        TEMPLATES_EXTENSION = 'ms',
        MyApp;

    MyApp =  {
        init            : function (options) {
            var that = this;
            // create a Sammy app, at least for a dummy use
            this.app = Sammy('#main', function (app) {
                // #### Sammy app code here
            });
            // plugging in pubsub
            pubsub(this.app);
            // plugging in router
            router(this.app);

            this.options = options;
            if ( options.templates_path ) {
                TEMPLATES_PATH = BASE_PATH + options.templates_path;
            }

            uijet.init({
                element             : '#main',
                route_prefix        : '#/',
                route_suffix        : '/',
                animation_type      : 'fade',
//                submit_handled      : true, // Uncomment this line to allow Sammy to capture form submission
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
        }
    };

    return MyApp;
}));