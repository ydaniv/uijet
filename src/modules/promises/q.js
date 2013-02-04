(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'q'], function (uijet, Q) {
            return factory(uijet, Q);
        });
    } else {
        factory(uijet, root.Q);
    }
}(this, function (uijet, Q) {

    uijet.use({
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
        when        : Q.when,
        whenAll     : Q.all,
        isPromise   : Q.isPromise
    }, uijet, Q);

    return Q;
}));