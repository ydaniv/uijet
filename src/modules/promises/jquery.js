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
     * @category Module
     * @sub-category Promises
     * @extends uijet
     * @see {@link http://api.jquery.com/category/deferred-object/}
     */
    uijet.use({
        /**
         * Constructs a promise object.
         *
         * @method module:promises/jquery#Promise
         * @returns {Promise} - a Promise object.
         */
        Promise     : function (resolver) {
            var deferred = $.Deferred(),
                promise = deferred.promise();

            resolver(deferred.resolve.bind(deferred), deferred.reject.bind(deferred));

            return promise;
        },
        /**
         * Constructs a deferred object.
         *
         * @method module:promises/jquery#defer
         * @see {@link http://api.jquery.com/jQuery.Deferred/}
         * @returns {Deferred} - a Deferred object.
         */
        defer       : $.Deferred,
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
         * Returns a Promise object that is rejected with the given reason.
         *
         * @method module:promises/jquery#reject
         * @param {Error} reason - the reason for rejecting the Promise.
         * @returns {Promise}
         */
        reject      : function (reason) {
            return $.Deferred.reject(reason);
        },
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
