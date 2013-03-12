(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'zepto'], function (uijet, $) {
            return factory(uijet, $, root);
        });
    } else {
        factory(uijet, root.Zepto, root);
    }
}(this, function (uijet, $, root) {
    $ = $ || root.Zepto;

    uijet.use({
        xhr : function (url, options) {
            var deferred = uijet.Promise(),
                promise = deferred.promise(),
                _options = {
                    success : function (response) {
                        deferred.resolve(response);
                    },
                    error   : function (xhr, errorType, error) {
                        deferred.reject(xhr, errorType, error);
                    }
                };
            // if `url` is a provided `String` URL
            if ( typeof url == 'string' ) {
                // add it to `_options`
                _options.url = url;
            }
            // if  `url` is an `Object` then use it as the config instead of `options`
            else if ( uijet.Utils.isObj(url) ) {
                options = url;
            }
            // if we have a configuration `Object` then use it
            if ( uijet.Utils.isObj(options) ) {
                // move success/error/complete callbacks to the deferred object's callbacks
                promise.then(options.success, options.error);
                if ( options.complete ) {
                    promise.always(options.complete);
                }
                // remove the original assignments
                delete options.success;
                delete options.error;
                delete options.complete;

                uijet.Utils.extend(_options, options);
            }

            $.ajax(_options);
            return promise;
        }
    }, uijet);

    return $;
}));