// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery'], function (uijet, $) {
            return factory(uijet, $);
        });
    } else {
        factory(uijet, jQuery);
    }
}(function (uijet, $) {
    uijet.Mixin('Submitted', {
        submitted       : true,
        // ### widget.send
        // @sign: send()  
        // @return: this OR $.ajax()
        //
        // Performs serialization of the `$element` using `getSerialized` and emits the data to
        // the URL got via `getSendUrl`.  
        // If `route_send` option is set to `true` then use that URL as a route in `runRoute`.  
        // If not then make an XHR call.
        send            : function () {
            var that = this,
                _data = this.getSerialized(),
                _url, context;
            // notify the `pre_send` signal and allow user to set the context
            context = this.notify('pre_send');
            // set the URL for sending
            _url = this.getSendUrl(context);
            if ( _url ) {
                // if `route_send` option is `true`
                if ( this.options.route_send ) {
                    // if using a router then run the URL as a route, otherwise publish it
                    uijet.options.routed ?
                        this.runRoute(_url.path + _data, true) :
                        this.publish('sent', { url: _url, data: _data });
                    return this;
                }
                // otherwise make an XHR
                return $.ajax(_url.path, {
                    type        : _url.method,
                    data        : _data,
                    contentType : this.options.send_content_type || 'application/x-www-form-urlencoded',
                    context     : this
                }).done(function (response) {
                    // notify `post_send_data` signal
                    this.notify('post_send_data', response);
                    // publish `post_send_data` event of this widget sandbox-wide
                    this.publish('post_send_data', response);
                }).fail(function () {
                    // emit the `send_error` signal
                    this.notify.apply(that, ['send_error'].concat(Array.prototype.slice.call(arguments)));
                }).always(function () {
                    // always call `_finally` at the end
                    this._finally();
                });
            }
        },
        setInitOptions  : function () {
            this._super();
            // if `serializer` option is set
            if ( this.options.serializer ) {
                // use it as a handler for `getSerialized` 
                this.getSerialized = this.options.serializer;
            }
            return this;
        },
        // ### widget.getSendUrl
        // @sign: getSendUrl([send_context])  
        // @return: send_url OR `undefined`
        //
        // Returns an `Object` with __method__ and __path__ keys which represent a RESTful route, which
        // is the URL that's used for submitting the form to, with the given HTTP method.  
        // This same URL will be used to route the serialized form if the `route_send` option is `true`.  
        // You can insert params into the URL, and it will work just like `getDataUrl`.  
        // Takes an optional `send_context` object which can be used instead of `this.context` if the latter is
        // used for presentational context.  
        // By default, the method is 'get'.  
        // If `send_url` option isn't set it returns `undefined`.
        getSendUrl      : function (send_context) {
            var url = uijet.Utils.returnOf(this.options.send_url, this),
                context = send_context || this.context,
                path;
            // if we have a URL to send to
            if ( url ) {
                if ( typeof url == 'string' ) {
                    // parse the URL
                    path = this.substitute(url, context);
                }
                else if ( uijet.Utils.isObj(url) ) {
                    // or parse the URL under __path__
                    path = this.substitute(url.path, context);
                } else {
                    return;
                }
                return {
                    method: url.method || 'get',
                    path: path || (url.path ? url.path : url)
                };
            }
        },
        // ### widget.getSerialized
        // @sign: getSerialized()  
        // @return: serialized_url_params
        //
        // Serializes the data and returns the params' string.  
        // By default returns an empty function. You can override it with the `serializer` option.
        getSerialized   : function () {
            return function () {};
        }
    });
}));
