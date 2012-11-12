// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'zepto'], function (uijet, $) {
            return factory(uijet, $);
        });
    } else {
        factory(uijet, root.Zepto);
    }
}(this, function (uijet, $) {
    uijet.use({
        $   : $
    }, uijet);

    return $;
}));