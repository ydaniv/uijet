(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([], function () {
            return factory(root);
        });
    }
    else {
        factory(root);
    }
}(this, function (root) {
    /**
     * ES6-Promise promises module.
     *
     * @module promises/es6
     * @category Module
     * @sub-category Promises
     * @extends uijet
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise}
     */
    return function (uijet) {
        uijet.use({
            /**
             * Constructs a promise object.
             *
             * @method module:promises/es6#Promise
             * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise}
             * @returns {Promise} - a Promise object.
             */
            Promise  : function (resolver) {
                return new root.Promise(resolver);
            },
            /**
             * Constructs a deferred object.
             *
             * This object will have the following methods:
             *
             * * `resolve`: resolves the contained Promise.
             * * `reject`: rejects the contained Promise.
             * * `promise`: returns the contained Promise object of this deferred.
             *
             * @method module:promises/es6#defer
             * @returns {Object} - a deferred object.
             */
            defer    : function () {
                var deferred = {},
                    promise = new root.Promise(function (resolve, reject) {
                        deferred.resolve = resolve;
                        deferred.reject = reject;
                    });
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
             * @method module:promises/es6#whenAll
             * @param {Array} promises - array of Promises and/or values.
             * @returns {Promise}
             */
            whenAll  : function (promises) {
                return root.Promise.all(promises);
            },
            /**
             * Converts any given argument into a Promise.
             * If that argument is a Promise it returns it.
             *
             * @method module:promises/es6#when
             * @param {*} value - value or promise to convert into a thenable.
             * @returns {Promise}
             */
            when     : function (value) {
                return root.Promise.resolve(value);
            },
            /**
             * Returns a Promise object that is rejected with the given reason.
             *
             * @method module:promises/es6#reject
             * @param {Error} reason - the reason for rejecting the Promise.
             * @returns {Promise}
             */
            reject   : function (reason) {
                return root.Promise.reject(reason);
            },
            /**
             * Returns a promise that resolves or rejects
             * as soon as one of the promises in the iterable
             * resolves or rejects, with the value or reason from that promise.
             *
             * @method module:promises/es6#race
             * @param {Promise[]} promises - array of Promises.
             * @returns {Promise}
             */
            race     : function (promises) {
                return root.Promise.race(promises);
            },
            /**
             * Whether the given `obj` argument is a Promise like object (thenable).
             *
             * @method module:promises/es6#isPromise
             * @param {*} obj - argument to check.
             * @returns {boolean}
             */
            isPromise: function (obj) {
                return ! ! (obj && uijet.utils.isFunc(obj.then));
            }
        });
    };
}));
