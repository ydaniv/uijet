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
         * Returns a deferred object.
         * 
         * **note**: for the sake of interoperability `promise` property is converted into a
         * method and a `state()` method is added which follows the spec of {@link http://api.jquery.com/deferred.state/}.
         * 
         * @method module:promises/when#Promise
         * @see {@link https://github.com/cujojs/when/blob/master/docs/api.md#whendefer}
         * @returns {deferred} - a "deferred" object.
         */
        Promise     : function () {

            var deferred = when.defer(),
                _promise = deferred.promise,
                state = 'pending';

            // turn promise property to a callable
            deferred.promise = function () {
                return _promise;
            };

            // polyfill the promise.state() method
            _promise.then(function () {
                state = 'resolved';
            }, function () {
                state = 'rejected';
            });

            deferred.state = function () {
                return state;
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
         * Whether the given `obj` argument is Promise-like object.
         * 
         * @method module:promises/when#isPromise
         * @see {@link https://github.com/cujojs/when/blob/master/docs/api.md#whenispromiselike}
         * @param {*} obj - argument to check.
         * @returns {boolean}
         */
        isPromise   : when.isPromiseLike
    }, uijet, when);

    return when;
}));
