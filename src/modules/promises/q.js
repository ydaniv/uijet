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
         * Returns a deferred object.
         * 
         * **note**: for the sake of interoperability `promise` property is converted into a
         * method and a `state()` method is added which follows the spec of {@link http://api.jquery.com/deferred.state/}.
         * 
         * @method module:promises/q#Promise
         * @see {@link https://github.com/kriskowal/q/wiki/API-Reference#qdefer}
         * @returns {deferred} - a "deferred" object.
         */
        Promise     : function () {

            var deferred = Q.defer(),
                promise = deferred.promise;

            // turn promise property to a callable
            deferred.promise = function () {
                return promise;
            };

            deferred.state = function () {
                return this.isFulfilled() ?
                        'resolved' :
                        this.isRejected() ?
                            'rejected' :
                            'pending';
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
        when        : Q.when,
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
        whenAll     : Q.all,
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
    }, uijet, Q);

    return Q;
}));
