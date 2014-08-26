(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'rsvp'], function (uijet, RSVP) {
            return factory(uijet, RSVP || root.RSVP);
        });
    } else {
        factory(uijet, root.RSVP);
    }
}(this, function (uijet, RSVP) {

    /**
     * RSVP promises module.
     * 
     * @module promises/rsvp
     * @category Module
     * @sub-category Promises
     * @extends uijet
     * @see {@link https://github.com/tildeio/rsvp.js/}
     * @exports RSVP
     */
    uijet.use({
        /**
         * Returns a deferred object.
         *
         * **note**: for the sake of interoperability `promise` property is converted into a method.
         * 
         * @method module:promises/rsvp#Promise
         * @see {@link https://github.com/tildeio/rsvp.js/#deferred}
         * @returns {deferred} - a "deferred" object.
         */
        defer       : function () {
            var deferred = RSVP.defer(),
                promise = deferred.promise;

            deferred.promise = function () {
                return promise;
            };

            return deferred;
        },
        /**
         * Constructs a promise object.
         *
         * @method module:promises/rsvp#Promise
         * @see {@link https://github.com/tildeio/rsvp.js/#basic-usage}
         * @returns {Promise} - a Promise object.
         */
        Promise     : function (resolver) {
            return new RSVP.Promise(resolver);
        },
        /**
         * Converts any given argument into a Promise.
         * If that argument is a Promise it returns it.
         * 
         * @method module:promises/rsvp#when
         * @param {*} value - value or promise to convert into a Promise.
         * @returns {Promise}
         */
        when   : function (value) {
            return RSVP.Promise.resolve(value);
        },
        /**
         * Returns a Promise that is resolved once all
         * Promises in the `promises` list are resolved,
         * or rejected if one of those is rejected.
         * 
         * @method module:promises/rsvp#whenAll
         * @see {@link https://github.com/tildeio/rsvp.js/#arrays-of-promises}
         * @param {Array} promises - array of Promises and/or values.
         * @returns {Promise}
         */
        whenAll: function (promises) {
            return RSVP.Promise.all(promises);
        },
        /**
         * Returns a Promise object that is rejected with the given reason.
         *
         * @method module:promises/es6#reject
         * @param {Error} reason - the reason for rejecting the Promise.
         * @returns {Promise}
         */
        reject : function (reason) {
            return RSVP.Promise.reject(reason);
        },
        /**
         * Returns a promise that resolves or rejects
         * as soon as one of the promises in the iterable
         * resolves or rejects, with the value or reason from that promise.
         *
         * @method module:promises/rsvp#race
         * @param {Promise[]} promises - array of Promises.
         * @returns {Promise}
         */
        race   : function (promises) {
            return RSVP.Promise.race(promises);
        },
        /**
         * Whether the given `obj` argument is a Promise.
         * 
         * @method module:promises/rsvp#isPromise
         * @param {*} obj - argument to check.
         * @returns {boolean}
         */
        isPromise   : function (obj) {
            return !!(obj && uijet.utils.isFunc(obj.then));
        }
    });

    return RSVP;
}));
