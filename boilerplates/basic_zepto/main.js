requirejs.config({
    baseUrl: '/',
    paths  : {
        uijet_dir: 'vendor/uijet',
        zepto    : 'vendor/zepto',
        eventbox : 'vendor/eventbox',
        rsvp: 'vendor/rsvp'
    }
});
requirejs(['app'], function (myApp) {
    myApp.start();
});
