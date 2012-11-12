// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'when'], function (uijet, when) {
            return factory(uijet, when);
        });
    } else {
        factory(uijet, root.when);
    }
}(this, function (uijet, when, undefined) {
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

            // polyfill deferred.done() and deferred.fail()
            deferred.done = function (callback) {
                var others = Array.prototype.slice.call(arguments, 1), c;
                deferred.then(callback);
                if ( others.length ) {
                    while ( c = others.shift() ) {
                        deferred.then(c);
                    }
                }
                return deferred;
            };
            deferred.fail = function (callback) {
                var others = Array.prototype.slice.call(arguments, 1), c;
                deferred.then(undefined, callback);
                if ( others.length ) {
                    while ( c = others.shift() ) {
                        deferred.then(undefined, c);
                    }
                }
                return deferred;
            };

            return deferred;
        },
        when    : function () {
            return when.all(arguments);
        }
    }, uijet, when);

    return when;
}));