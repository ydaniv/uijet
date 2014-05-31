(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'rsvp'], function (uijet) {
            return factory(uijet, root.RSVP, root);
        });
    } else {
        factory(uijet, root.RSVP, root);
    }
}(this, function (uijet, RSVP) {

    var p_proto = RSVP.Promise.prototype;

    if ( ! ('state' in p_proto) && ! ('promise' in p_proto) ) {
        p_proto.state = function () {
            var state = 'pending';
            if ( this.isResolved ) {
                state = 'resolved';
            }
            else if ( this.isRejected ) {
                state = 'rejected';
            }
            return state;
        };
        p_proto.promise = function () {
            return this;
        };
    }
    else {
        throw new Error('Integration Error: RSVP.Promise.prototype already has that property.');
    }

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
         * **note**: for the sake of interoperability `promise` property is converted into a
         * method and a `state()` method is added which follows the spec of {@link http://api.jquery.com/deferred.state/}.
         * 
         * @method module:promises/rsvp#Promise
         * @see {@link https://github.com/tildeio/rsvp.js/#deferred}
         * @returns {deferred} - a "deferred" object.
         */
        Promise     : RSVP.defer,
        /**
         * Converts any given argument into a Promise.
         * If that argument is a Promise it returns it.
         * 
         * @method module:promises/rsvp#when
         * @param {*} value - value or promise to convert into a Promise.
         * @returns {Promise}
         */
        when        : function (value) {
            return this.isPromise(value) ? value : this.Promise().resolve(value);
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
        whenAll     : RSVP.all,
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
