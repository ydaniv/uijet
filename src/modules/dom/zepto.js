(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['zepto'], function ($) {
            return factory($, root);
        });
    } else {
        factory(root.Zepto, root);
    }
}(this, function ($, root) {
    $ = $ || root.Zepto;
    /**
     * Zepto dom module.
     * 
     * @module dom/zepto
     * @category Module
     * @sub-category DOM
     * @extends uijet
     * @see {@link http://zeptojs.com/}
     */
    return function (uijet) {
        uijet.use({
            /**
             * Reference to Zepto.
             *
             * @see {@link http://zeptojs.com/}
             * @method module:dom/zepto#$
             */
            $: $
        }, uijet);

        return $;
    };
}));
