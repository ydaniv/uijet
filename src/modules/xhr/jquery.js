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
     * jQuery xhr module.
     * 
     * @module xhr/jquery
     * @category Module
     * @sub-category XHR
     * @extends uijet
     * @see {@link http://api.jquery.com/category/ajax/}
     */
    uijet.use({
        /**
         * Reference to jQuery.ajax().
         * 
         * @see {@link http://api.jquery.com/jQuery.ajax/}
         * @method module:xhr/jquery#xhr
         * @returns {Promise}
         */
        xhr :$.ajax
    }, uijet, $);
}));
