requirejs.config({
    baseUrl : '.',
    paths   : {
        uijet_dir   : 'lib/uijet',
        zepto       : 'lib/zepto',
        eventbox    : 'lib/eventbox',
        q           : 'lib/q'
    }
});
requirejs(['app'], function (myApp) {
    myApp.init();
});