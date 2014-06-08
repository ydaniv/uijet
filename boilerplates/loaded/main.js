requirejs.config({
    baseUrl: '/',
    paths  : {
        // 3rd party libs
        uijet_dir  : 'vendor/uijet',
        jquery     : 'vendor/jquery',
        eventbox   : 'vendor/eventbox',
        when       : 'vendor/when',
        velocity   : 'vendor/velocity',
        backbone   : 'vendor/backbone',
        lodash     : 'vendor/lodash.underscore',
        rivets     : 'vendor/rivets',
        // a patch for Rivets' each-* binding for best interoperability with uijet
        rivets_each: 'uijet/src/modules/binding/rivets-each-alt',

        // project modules
        resources  : 'resources',
        routes     : 'routes'
    },
    shim   : {
        backbone                         : {
            deps   : [
                'lodash', 'jquery'
            ],
            exports: 'Backbone'
        },
        rivets_each                      : ['rivets'],
        'modules/binding/rivets-backbone': ['modules/data/backbone', 'rivets_each']
    }
});
requirejs(['app'], function (myApp) {
    myApp.start();
});
