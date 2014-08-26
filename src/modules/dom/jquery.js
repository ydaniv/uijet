(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery'], function (uijet, $) {
            return factory(uijet, $);
        });
    } else {
        factory(uijet, root.jQuery);
    }
}(this, function (uijet, $) {
    /**
     * jQuery dom module.
     * 
     * @module dom/jquery
     * @category Module
     * @sub-category DOM
     * @extends uijet
     * @see {@link http://api.jquery.com/}
     * @exports jQuery
     */
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
}));
