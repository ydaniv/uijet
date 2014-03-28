(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Deferred mixin class.
     * 
     * @class Deferred
     * @extends uijet.BaseWidget
     */
    uijet.Mixin('Deferred', {
        deferred: true,
        /**
         * Wraps the `wake()` call with a promise that defers it.
         * 
         * Related options:
         * * `promise`: a promise object, or a function that returns one, that once resolved invokes `wake()`.
         * If it's a function it takes the `context` argument as param.
         * 
         * @memberOf Deferred
         * @instance
         * @param {*} [context] - will be supplied to the `promise` option if it's a `function`.
         * @returns {Promise}
         */
        wake    : function (context) {
            var _super = this._super,
                promise;
            if ( this.options.promise ) {
                promise = uijet.utils.returnOf(this.options.promise, this, context);
                return uijet.when(promise).then(function (value) {
                    _super.call(this, value);
                }.bind(this));
            }
            else {
                return _super.apply(this, arguments);
            }
        }
    });
}));
