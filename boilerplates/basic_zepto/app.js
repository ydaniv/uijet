define([
    'uijet_dir/uijet',
    'uijet_dir/modules/dom/zepto',
    'uijet_dir/modules/pubsub/eventbox',
    'uijet_dir/modules/promises/when'
], function (uijet, $, Ebox, when) {
    
    return {
        start: function () {
            uijet.init({
                element : '#main'
            });
        }
    };
});
