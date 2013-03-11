define([
    'uijet_dir/uijet',
    'uijet_dir/modules/dom/zepto',
    'uijet_dir/modules/pubsub/eventbox',
    'uijet_dir/modules/promises/q',
    'uijet_dir/modules/xhr/zepto'
], function (uijet, $, Ebox, Q, global) {
    
    var MyApp =  {
            init            : function (options) {
                uijet.init({
                    element : '#main'
                });
            }
        };

    return MyApp;
});