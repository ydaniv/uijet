(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'zepto'], function (uijet, $) {
            return factory(uijet, $, root);
        });
    } else {
        factory(uijet, root.Zepto, root);
    }
}(this, function (uijet, $, root) {
    $ = $ || root.Zepto;
    uijet.use({
        $   : $
    }, uijet);

    return $;
}));