(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'when'], function (uijet, when) {
            return factory(uijet, when);
        });
    } else {
        factory(uijet, root.when);
    }
}(this, function (uijet, when) {

    /**
     * when.js promises module.
     * 
     * @module promises/when
     * @category Module
     * @sub-category Promises
     * @extends uijet
     * @see {@link https://github.com/cujojs/when/wiki}
     * @exports when
     */
    uijet.use({
        /**
         * Constructs a promise object.
         *
         * @method module:promises/when#Promise
         * @see {@link https://github.com/cujojs/when/blob/master/docs/api.md#whenpromise}
         * @returns {Promise} - a Promise object.
         */
        Promise     : when.promise,
        /**
         * Returns a deferred object.
         *
         * **note**: for the sake of interoperability `promise` property is converted into a method.
         *
         * @method module:promises/when#defer
         * @see {@link https://github.com/cujojs/when/blob/master/docs/api.md#whendefer}
         * @returns {deferred} - a "deferred" object.
         */
        defer       : function () {

            var deferred = when.defer(),
                promise = deferred.promise;

            // turn promise property to a callable
            deferred.promise = function () {
                return promise;
            };

            return deferred;
        },
        /**
         * Returns a Promise that is resolved once all
         * Promises in the `promises` list are resolved,
         * or rejected if one of those is rejected.
         * 
         * @method module:promises/when#whenAll
         * @see {@link https://github.com/cujojs/when/blob/master/docs/api.md#whenall}
         * @param {Array} promises - array of Promises and/or values.
         * @returns {Promise}
         */
        whenAll     : when.all,
        /**
         * Converts any given argument into a Promise.
         * If that argument is a Promise it returns it.
         * 
         * @method module:promises/when#when
         * @see {@link https://github.com/cujojs/when/blob/master/docs/api.md#when}
         * @param {*} value - value or promise to convert into a Promise.
         * @returns {Promise}
         */
        when        : when,
        /**
         * Returns a Promise object that is rejected with the given reason.
         *
         * @method module:promises/when#reject
         * @param {Error} reason - the reason for rejecting the Promise.
         * @returns {Promise}
         */
        reject      : when.reject,
        /**
         * Returns a promise that resolves or rejects
         * as soon as one of the promises in the iterable
         * resolves or rejects, with the value or reason from that promise.
         *
         * @method module:promises/when#race
         * @param {Promise[]} promises - array of Promises.
         * @returns {Promise}
         */
        race        : when.Promise.race,
        /**
         * Whether the given `obj` argument is Promise-like object.
         * 
         * @method module:promises/when#isPromise
         * @see {@link https://github.com/cujojs/when/blob/master/docs/api.md#whenispromiselike}
         * @param {*} obj - argument to check.
         * @returns {boolean}
         */
        isPromise   : when.isPromiseLike
    });

    return when;
}));
