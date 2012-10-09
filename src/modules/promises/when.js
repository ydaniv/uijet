// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'when'], function (uijet, when) {
            return factory(uijet, when);
        });
    } else {
        factory(uijet, root.when);
    }
}(this, function (uijet, when) {
    // UIjet is using jQuery.Deferred's API for pomises
    // so we'll adapt when.js's API to it
    uijet.use({
        Promise : function () {

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
        when    : function () {
            return when.all(arguments);
        }
    }, uijet, when);

    return when;
}));