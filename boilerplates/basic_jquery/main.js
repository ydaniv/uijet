requirejs.config({
    baseUrl: '/',
    paths  : {
        uijet_dir: 'vendor/uijet',
        jquery   : 'vendor/jquery',
        eventbox : 'vendor/eventbox'
    }
});
requirejs(['app'], function (app) {
    app.start();
});
