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
        when        : function () {
            return when.all(arguments);
        },
        isPromise   : function (obj) {
            return obj && (uijet.Utils.isFunc(obj.then) || obj.promise && uijet.Utils.isFunc(obj.promise.then));
        }
    }, uijet, when);

    return when;
}));