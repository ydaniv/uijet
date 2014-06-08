define([
    'uijet_dir/uijet',
    'uijet_dir/modules/router/backbone',
    'resources',
    'routes',
    'uijet_dir/modules/data/backbone',
    'uijet_dir/modules/binding/rivets-backbone',
    'uijet_dir/modules/dom/jquery',
    'uijet_dir/modules/animation/velocity',
    'uijet_dir/modules/promises/when',
    'uijet_dir/modules/pubsub/eventbox',
    'uijet_dir/modules/xhr/jquery'
], function (uijet, Router, resources, routes, Backbone, rivets, $, velocity, when, Ebox) {
    
    return {
        router: Router({
            routes: routes
        }),
        start : function () {
            uijet.init({
                element    : '#main',
                resources  : resources,
                pre_startup: function () {
                    // kickstart the Backbone router
                    Backbone.history.start();
                }
            });
        }
    };
});
