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
    /**
     * Zepto dom module.
     * 
     * @module dom/zepto
     * @extends uijet
     * @see {@link http://zeptojs.com/}
     * @exports Zepto
     */
    uijet.use({
        /**
         * Reference to Zepto.
         * 
         * @see {@link http://zeptojs.com/}
         * @method module:dom/zepto#$
         */
        $   : $
    }, uijet);

    return $;
}));
