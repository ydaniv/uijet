(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    }
    else {
        factory(root.uijet);
    }
}(this, function (uijet) {
    /**
     * ES6-Promise promises module.
     *
     * @module promises/es6
     * @category Module
     * @sub-category Promises
     * @extends uijet
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise}
     */
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
        whenAll  : root.Promise.all,
        /**
         * Converts any given argument into a Promise.
         * If that argument is a Promise it returns it.
         *
         * @method module:promises/es6#when
         * @param {*} value - value or promise to convert into a thenable.
         * @returns {Promise}
         */
        when     : root.Promise.resolve,
        /**
         * Returns a Promise object that is rejected with the given reason.
         *
         * @method module:promises/es6#reject
         * @param {Error} reason - the reason for rejecting the Promise.
         * @returns {Promise}
         */
        reject   : root.Promise.reject,
        /**
         * Returns a promise that resolves or rejects
         * as soon as one of the promises in the iterable
         * resolves or rejects, with the value or reason from that promise.
         *
         * @method module:promises/es6#race
         * @param {Promise[]} promises - array of Promises.
         * @returns {Promise}
         */
        race     : root.Promise.race,
        /**
         * Whether the given `obj` argument is a Promise like object (thenable).
         *
         * @method module:promises/es6#isPromise
         * @param {*} obj - argument to check.
         * @returns {boolean}
         */
        isPromise: function (obj) {
            return !!(obj && uijet.utils.isFunc(obj.then));
        }
    });
}));
