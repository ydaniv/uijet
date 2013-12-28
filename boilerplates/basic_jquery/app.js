define([
    'uijet_dir/uijet',
    'uijet_dir/modules/dom/jquery',
    'uijet_dir/modules/pubsub/eventbox',
    'uijet_dir/modules/promises/jquery',
    'uijet_dir/modules/xhr/jquery'
], function (uijet, $, Ebox) {

   var TEMPLATES_PATH = '/static_path/myapp/templates/',
        TEMPLATES_EXTENSION = 'ms',
        MyApp;

    MyApp = {
        init: function () {
            uijet.init({
                element            : '#main', // the top element containing your app
                templates_path     : TEMPLATES_PATH,
                templates_extension: TEMPLATES_EXTENSION
            });
        }
    };

    return MyApp;
});
