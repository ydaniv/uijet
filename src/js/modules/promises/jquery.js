// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery'], function (uijet, $) {
            return factory(uijet, $);
        });
    } else {
        root.uijet_promises = factory(uijet, root.jQuery);
    }
}(this, function (uijet, $) {
    return function () {
        uijet.use({
            Promise : $.Deferred,
            when    : $.when
        }, uijet, $);

        return $;
    };
}));