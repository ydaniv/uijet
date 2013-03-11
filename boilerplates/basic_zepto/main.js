requirejs.config({
    baseUrl : '.',
    paths   : {
        uijet_dir   : 'lib/uijet',
        plugins     : 'lib',
        zepto       : 'lib/zepto',
        eventbox    : 'lib/eventbox',
        q           : 'lib/q'
    }
});
requirejs(['myapp'], function (myApp) {
    myApp.init();
});