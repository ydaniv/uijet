requirejs.config({
    baseUrl: '/',
    paths  : {
        uijet_dir: 'vendor/uijet',
        zepto    : 'vendor/zepto',
        eventbox : 'vendor/eventbox',
        when     : 'vendor/when'
    }
});
requirejs(['app'], function (myApp) {
    myApp.start();
});
