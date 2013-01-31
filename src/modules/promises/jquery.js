// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery'], function (uijet, $) {
            return factory(uijet, $);
        });
    } else {
        factory(uijet, root.jQuery);
    }
}(this, function (uijet, $) {
    uijet.use({
        Promise     : $.Deferred,
        when        : function (dfrds) {
            return $.when.apply($, dfrds);
        },
        isPromise   : function (obj) {
            return obj && uijet.Utils.isFunc(obj.then);
        }
    }, uijet, $);
}));