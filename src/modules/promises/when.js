(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'when'], function (uijet, when) {
            return factory(uijet, when);
        });
    } else {
        factory(uijet, root.when);
    }
}(this, function (uijet, when, undefined) {

    uijet.use({
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
        whenAll     : when.all,
        when        : when,
        isPromise   : when.isPromise
    }, uijet, when);

    return when;
}));