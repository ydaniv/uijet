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
        // ### widget.submit
        // @sign: submit([request_data])  
        // @return: this OR uijet.xhr()
        //
        // Performs serialization of the `$element` using `getSerialized` and emits the data to
        // the URL got via `getSubmitUrl`.  
        // If `route_submit` option is set to `true` then use that URL as a route in `runRoute`.  
        // If not then make an XHR call.
        // The optional `request_data` argument can be used to submit additional data to the `serializer`.
        submit          : function (request_data) {
            var that = this,
                _data = this.getSerialized(request_data),
                _inner = typeof this.options.inner_route == 'boolean' ? this.options.inner_route : true,
                dfrd = uijet.Promise(),
                _url, context;
            this.validate(_data)
                .then(
                    // passed validation
                    function () {
                        // notify the `pre_submit` signal and allow user to set the context
                        context = that.notify('pre_submit');
                        // set the URL for submitting
                        _url = that.getSubmitUrl(context);
                        // if there's a URI to submit to
                        if ( _url ) {
                            // if user chose to submit the data as a route or an event
                            if ( that.options.route_submit ) {
                                // if using a router then run the URL as a route, otherwise publish it
                                uijet.options.routed ?
                                    that.runRoute(_url.path + _data, _inner) :
                                    that.publish('submitted', { url: _url, data: _data });
                                dfrd.resolve();
                                return;
                            }
                            // otherwise make an XHR
                            uijet.xhr(_url.path, {
                                type        : _url.method,
                                data        : _data,
                                contentType : that.options.submit_content_type || 'application/x-www-form-urlencoded',
                                context     : that
                            })
                            .then(
                                function (response) {
                                    dfrd.resolve(response);
                                    // notify `post_submit_data` signal
                                    this.notify('post_submit_data', response);
                                    // publish `post_submit_data` event of this widget sandbox-wide
                                    this.publish('post_submit_data', response);
                                },
                                function (e) {
                                    dfrd.reject(e);
                                    // emit the `submit_error` signal
                                    this.notify.apply(that, ['submit_error'].concat(Array.prototype.slice.call(arguments)));
                                }
                            );
                        }
                        else {
                            // otherwise just publish 'submitted' event with the data
                            that.publish('submitted', _data);
                            dfrd.resolve();
                        }
                    },
                    // failed validation
                    function (failed) {
                        dfrd.reject(failed);
                        that.notify('not_valid', failed, _data);
                    }
                );

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
                returnOf = uijet.utils.returnOf,
                isObj = uijet.utils.isObj,
                deferred = uijet.Promise(),
                valid = true,
                failed = {},
                promises = [],
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
                            promises.push(check);
                        }
                    }
                }
            }

            uijet.whenAll(promises).then(
                function () {
                    valid ? deferred.resolve() : deferred.reject(failed);
                },
                function (failure) {
                    failed['__deferred'] = failure;
                    deferred.reject(failed);
                }
            );

            return deferred.promise();
        },
        // ### widget.getSubmitUrl
        // @sign: getSubmitUrl([submit_context])  
        // @return: submit_url OR `undefined`
        //
        // Returns an `Object` with __method__ and __path__ keys which represent a RESTful route, which
        // is the URL that's used for submitting the form to, with the given HTTP method.  
        // This same URL will be used to route the serialized form if the `route_submit` option is `true`.  
        // You can insert params into the URL, and it will be interpolated using `substitute()`, which defaults
        // to `uijet.utils.format()`.  
        // Takes an optional `submit_context` object which can be used instead of `this.getContext()` if the latter is
        // used for presentational context.  
        // By default, the method is 'GET'.  
        // If `submit_url` option isn't set it returns `undefined`.
        getSubmitUrl    : function (submit_context) {
            var context = submit_context || this.getContext();
            return uijet.utils.parseRestUrl(
                uijet.utils.returnOf(this.options.submit_url, this, context),
                context
            );
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
