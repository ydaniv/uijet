// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Submitted', {
        submitted       : true,
        // ### widget.send
        // @sign: send([request_data])  
        // @return: this OR uijet.xhr()
        //
        // Performs serialization of the `$element` using `getSerialized` and emits the data to
        // the URL got via `getSendUrl`.  
        // If `route_send` option is set to `true` then use that URL as a route in `runRoute`.  
        // If not then make an XHR call.
        // The optional `request_data` argument can be used to send additional data to the `serializer`.
        send            : function (request_data) {
            var that = this,
                _data = this.getSerialized(request_data),
                _inner = typeof this.options.inner_route == 'boolean' ? this.options.inner_route : true,
                dfrd = uijet.Promise(),
                _url, context;
            uijet.when( this.validate(_data) )
                // passed validation
                .done(function () {

                    that.serialize(_data);
                    // notify the `pre_send` signal and allow user to set the context
                    context = that.notify(true, 'pre_send');
                    // set the URL for sending
                    _url = that.getSendUrl(context);
                    // if there's a URI to send to
                    if ( _url ) {
                        // if user chose to send the data as a route or an event
                        if ( that.options.route_send ) {
                            // if using a router then run the URL as a route, otherwise publish it
                            uijet.options.routed ?
                                that.runRoute(_url.path + _data, _inner) :
                                that.publish('sent', { url: _url, data: _data });
                            dfrd.resolve();
                            return;
                        }
                        // otherwise make an XHR
                        uijet.xhr(_url.path, {
                            type        : _url.method,
                            data        : _data,
                            contentType : that.options.send_content_type || 'application/x-www-form-urlencoded',
                            context     : that
                        })
                        .done(function (response) {
                            dfrd.resolve(response);
                            // notify `post_send_data` signal
                            this.notify(true, 'post_send_data', response);
                            // publish `post_send_data` event of this widget sandbox-wide
                            this.publish('post_send_data', response);
                        })
                        .fail(function () {
                            dfrd.reject();
                            // emit the `send_error` signal
                            this.notify.apply(that, [true, 'send_error'].concat(Array.prototype.slice.call(arguments)));
                        });
                    }
                    else {
                        // otherwise just publish 'sent' event with the data
                        that.publish('sent', _data);
                        dfrd.resolve();
                    }
                })
                // failed validation
                .fail(function (failed) {
                    dfrd.reject(failed);
                    that.notify(true, 'not_valid', failed, _data);
                });
            return dfrd.promise();
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
        //TODO: add docs
        validate        : function (_data) {
            var validators = this.options.validators,
                returnOf = uijet.Utils.returnOf,
                isObj = uijet.Utils.isObj,
                promise = uijet.Promise(),
                valid = true,
                failed = {},
                deferred = [],
                v, check;

            if ( isObj(validators) ) {
                for ( v in validators ) {
                    if ( v in _data ) {
                        check = returnOf(validators[v], this, _data[v], _data);
                        if ( ! check ) {
                            valid = false;
                            failed[v] = _data[v];
                        }
                        else if ( uijet.isPromise(check) ) {
                            deferred.push(check);
                        }
                    }
                }
            }

            uijet.when.apply(uijet, deferred).then(
                function () {
                    valid ? promise.resolve() : promise.reject(failed);
                },
                function (failure) {
                    failed['__deferred'] = failure;
                    promise.reject(failed);
                }
            );

            return promise.promise();
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
        // By default, the method is 'GET'.  
        // If `send_url` option isn't set it returns `undefined`.
        getSendUrl      : function (send_context) {
            return this.getRestUrl(this.options.send_url, send_context);
        },
        // ### widget.getSerialized
        // @sign: getSerialized([request_data])  
        // @return: serialized_url_params
        //
        // Serializes the data and returns the params' string.  
        // You can override it with the `serializer` option.  
        // By default returns an the optional `request_data` argument.
        getSerialized   : function (request_data) {
            return request_data;
        }
    });
}));