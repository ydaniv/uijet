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
     * jQuery promises module.
     * 
     * @module promises/jquery
     * @extends uijet
     * @see {@link http://api.jquery.com/category/deferred-object/}
     */
    uijet.use({
        /**
         * Constructs a deferred object.
         * 
         * @method module:promises/jquery#Promise
         * @see {@link http://api.jquery.com/jQuery.Deferred/}
         * @returns {Deferred} - a Deferred object.
         */
        Promise     : $.Deferred,
        /**
         * Returns a Promise that is resolved once all
         * Promises in the `promises` list are resolved,
         * or rejected if one of those is rejected.
         * 
         * @method module:promises/jquery#whenAll
         * @see {@link http://api.jquery.com/jQuery.when/}
         * @param {Array} promises - array of Promises and/or values.
         * @returns {Promise}
         */
        whenAll     : function (promises) {
            return $.when.apply($, promises);
        },
        /**
         * Converts any given argument into a Promise.
         * If that argument is a Promise it returns it.
         * 
         * @method module:promises/jquery#when
         * @see {@link http://api.jquery.com/jQuery.when/}
         * @param {*} value - value or promise to convert into a thenable.
         * @returns {Promise}
         */
        when        : $.when,
        /**
         * Whether the given `obj` argument is a Promise.
         * 
         * @method module:promises/jquery#isPromise
         * @param {*} obj - argument to check.
         * @returns {boolean}
         */
        isPromise   : function (obj) {
            return !!(obj && uijet.utils.isFunc(obj.then));
        }
    }, uijet, $);
}));
