(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['jquery'], function ($) {
            return factory($);
        });
    } else {
        factory(root.jQuery);
    }
}(this, function ($) {
    /**
     * jQuery dom module.
     * 
     * @module dom/jquery
     * @category Module
     * @sub-category DOM
     * @extends uijet
     * @see {@link http://api.jquery.com/}
     */
    return function (uijet) {
        uijet.use({
            /**
             * Reference to jQuery.
             *
             * @see {@link http://api.jquery.com/}
             * @method module:dom/jquery#$
             */
            $   : $
        }, uijet);

        return $;
    };
}));
