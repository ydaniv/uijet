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
     * Scrolled mixin class.
     * 
     * @mixin Submitted
     * @category Mixin
     * @extends BaseWidget
     */
    uijet.Mixin('Submitted', {
        submitted       : true,
        /**
         * Submits the element's serialized data.
         * The data is first validated and then either published as a route,
         * or sent as a request to a remote URI.
         * 
         * #### Signals:
         * 
         * * `pre_submit`: triggered after validation passed. Optionally may return a context object passed on as an
         * argument to {@link Submitted#getSubmitUrl}.
         * * `post_submit_data`: triggered in the success handler for the (XHR) submission request.
         * Takes the response object.
         * * `submit_error`: triggered in the fail handler of the (XHR) submission request.
         * Takes the arguments of the fail handler.
         * * `not_valid`: triggered after validation failed. Takes the failure object of failing field(s) and message(s)
         * and the the data submitted for validation.
         * 
         * #### App events:
         * 
         * * `<this.id>.submitted`: published if there's no `submit_url` or if `route_submit` is `true` and
         * router module is not loaded. Takes the serialized data.
         * * `<this.id>.post_submit_data`: published at the end of a successful response of a submission via request.
         * Takes the response object.
         * 
         * #### Related options:
         * 
         * * `route_submit`: if `true` attempts to submit the serialized data via routing, if a router module is loaded.
         * If not it will fallback to publishing an event named `<this.id>.submitted` with the serialized data.
         * * `submit_xhr_config`: a config object to override config of the XHR sent on submission.
         * * `submit_url`: a URI to submit the data to. This can be a `string`, an `Object` in the
         * form of `{ path: String, method: String}` ({@see uijet.utils#parseRestUrl}), a template to format or
         * `function` returning one of the above.
         * 
         * @memberOf Submitted
         * @instance
         * @param {Object} [request_data]
         * @returns {Promise}
         */
        submit          : function (request_data) {
            var that = this,
                _data = this.getSerialized(request_data),
                _url, context;
            return this.validate(_data)
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
                                    that.runRoute(_url.path + _data) :
                                    that.publish('submitted', _data);
                            }
                            else {
                                // otherwise make an XHR
                                return uijet.xhr(_url.path, uijet.utils.extend({
                                    type        : _url.method,
                                    data        : _data,
                                    context     : that
                                }, that.options.submit_xhr_config || {}))
                                .then(
                                    function (response) {
                                        // notify `post_submit_data` signal
                                        this.notify('post_submit_data', response);
                                        // publish `post_submit_data` event of this widget sandbox-wide
                                        this.publish('post_submit_data', response);
                                        return response;
                                    },
                                    function (e) {
                                        // emit the `submit_error` signal
                                        this.notify.apply(that, ['submit_error'].concat(Array.prototype.slice.call(arguments)));
                                        return uijet.Promise().reject(e);
                                    }
                                );
                            }
                        }
                        else {
                            // otherwise just publish 'submitted' event with the data
                            that.publish('submitted', _data);
                        }
                    },
                    // failed validation
                    function (failed) {
                        that.notify('not_valid', failed, _data);
                        return uijet.Promise().reject(failed);
                    }
                );
        },
        /**
         * Sets {@link Submitted#getSerialized} with the `serializer` option.
         * This function will serialize the instance.
         * 
         * #### Related options:
         * 
         * * `serializer`: `function` that serializes the instance and returns the data.
         * 
         * @memberOf Submitted
         * @instance
         * @returns {Submitted}
         */
        setInitOptions  : function () {
            this._super();
            // if `serializer` option is set
            if ( this.options.serializer ) {
                // use it as a handler for `getSerialized` 
                this.getSerialized = this.options.serializer;
            }
            return this;
        },
        /**
         * Validates the raw data coming from {@link Submitted#getSerialized}.
         * Every function should return a `string` of error message in case of failure, otherwise
         * it's considered valid.
         * 
         * #### Related options:
         * 
         * * `validators`: map of field names to validation functions. Each function should return an
         * error message string in case of validation error, otherwise it is considered passed.
         * 
         * @memberOf Submitted
         * @instance
         * @param {Object} _data - serialized map of field names to values.
         * @returns {Promise} - if rejected the handler will be sent a object mapping failed field names to error messages.
         */
        validate        : function (_data) {
            var validators = this.options.validators,
                returnOf = uijet.utils.returnOf,
                isObj = uijet.utils.isObj,
                valid = true,
                failed = {},
                promises = [],
                v, check;

            // if there's a validation map
            if ( isObj(validators) ) {
                // loop over validations
                for ( v in validators ) {
                    // for every key in the map that maps to a key in the serialized data
                    if ( v in _data ) {
                        // perform the validation
                        check = returnOf(validators[v], this, _data[v], _data);
                        // if returned value is a promise
                        if ( uijet.isPromise(check) ) {
                            // add it to the list of deferred validations
                            promises.push(check.then(null, (function (field_name) {
                                // create a rejection handler
                                return function (reason) {
                                    // set the reason to the failed object under the name of the failing field
                                    failed[field_name] = reason;
                                    return uijet.Promise().reject(failed);
                                };
                            }(v))));
                        }
                        // if failed validation and we have a message
                        else if ( typeof check == 'string' ) {
                            // mark this check as failed
                            valid = false;
                            // add a property to the failed map: `{ <field_name>: <error_message> }`
                            failed[v] = check;
                        }
                    }
                }
            }

            // if valid return a promise depending on deferred validations, if any exist
            return valid ?
                   uijet.whenAll(promises) :
                   // otherwise return a rejected promise with the `failed` map as reason
                   uijet.Promise().reject(failed);
        },
        /**
         * Gets the URI to use for submitting the request or routing to.
         * Takes an optional context to use for parsing the URI, defaults to
         * the `context` of the instance.
         * 
         * #### Related options:
         * 
         * * `submit_url`: a URI to submit the data to. This can be a `string`, an `Object` in the
         * form of `{ path: String, method: String}` ({@see uijet.utils#parseRestUrl}), a template to format or
         * `function` returning one of the above.
         * 
         * @memberOf Submitted
         * @instance
         * @param {Object} [submit_context] - context to use for parsing `submit_url`.
         * @returns {{method: string, path: string}} - a REST URI to use for request/route.
         */
        getSubmitUrl    : function (submit_context) {
            var context = submit_context || this.getContext();
            return uijet.utils.parseRestUrl(
                uijet.utils.returnOf(this.options.submit_url, this, context),
                context
            );
        },
        /**
         * Serializes the instance's state and returns the data.
         * This is just a stub that needs to be implemented and set to the `serializer` option.
         * 
         * #### Related options:
         * 
         * * `serializer`: a function that will serialize the state and will be used instead of this stub.
         * 
         * @memberOf Submitted
         * @instance
         * @param {Object} [request_data] - additional data to add to the serialized state.
         * @returns {*} - serialized data.
         */
        getSerialized   : function (request_data) {
            return request_data;
        }
    });
}));
