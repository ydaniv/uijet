define([
    'uijet_dir/uijet',
    'uijet_dir/modules/dom/jquery',
    'uijet_dir/modules/pubsub/eventbox',
    'uijet_dir/modules/promises/jquery'
], function (uijet, $, Ebox) {

    return {
        start: function () {
            uijet.init({
                element: '#main'
            });
        }
    };
});
