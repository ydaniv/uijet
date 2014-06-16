(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'q'], function (uijet, Q) {
            return factory(uijet, Q);
        });
    } else {
        factory(uijet, root.Q);
    }
}(this, function (uijet, Q) {
    /**
     * Q promises module.
     * 
     * @module promises/q
     * @category Module
     * @sub-category Promises
     * @extends uijet
     * @see {@link https://github.com/kriskowal/q#resources}
     * @exports Q
     */
    uijet.use({
        /**
         * Constructs a promise object.
         *
         * @method module:promises/q#Promise
         * @see {@link https://github.com/cujojs/when/blob/master/docs/api.md#whenpromise}
         * @returns {Promise} - a Promise object.
         */
        Promise     : Q.Promise,
        /**
         * Returns a deferred object.
         *
         * **note**: for the sake of interoperability `promise` property is converted into a method.
         *
         * @method module:promises/q#defer
         * @see {@link https://github.com/kriskowal/q/wiki/API-Reference#qdefer}
         * @returns {deferred} - a "deferred" object.
         */
        defer       : function () {

            var deferred = Q.defer(),
                promise = deferred.promise;

            // turn promise property to a callable
            deferred.promise = function () {
                return promise;
            };

            return deferred;
        },
        /**
         * Converts any given argument into a Promise.
         * If that argument is a Promise it returns it.
         * 
         * @method module:promises/q#when
         * @see {@link https://github.com/kriskowal/q/wiki/API-Reference#promise-methods}
         * @param {*} value - value or promise to convert into a Promise.
         * @returns {Promise}
         */
        when        : Q,
        /**
         * Returns a Promise that is resolved once all
         * Promises in the `promises` list are resolved,
         * or rejected if one of those is rejected.
         * 
         * @method module:promises/q#whenAll
         * @see {@link https://github.com/kriskowal/q/wiki/API-Reference#promiseall}
         * @param {Array} promises - array of Promises and/or values.
         * @returns {Promise}
         */
        whenAll     : Q.Promise.all,
        /**
         * Returns a Promise object that is rejected with the given reason.
         *
         * @method module:promises/q#reject
         * @param {Error} reason - the reason for rejecting the Promise.
         * @returns {Promise}
         */
        reject      : Q.Promise.reject,
        /**
         * Returns a promise that resolves or rejects
         * as soon as one of the promises in the iterable
         * resolves or rejects, with the value or reason from that promise.
         *
         * @method module:promises/q#race
         * @param {Promise[]} promises - array of Promises.
         * @returns {Promise}
         */
        race        : Q.Promise.race,
        /**
         * Whether the given `obj` argument is a Promise.
         * 
         * @method module:promises/q#isPromise
         * @param {*} obj - argument to check.
         * @returns {boolean}
         */
        isPromise   : function (obj) {
            return Q.isPromise(obj) || Q.isPromiseAlike(obj);
        }
    });

    return Q;
}));
