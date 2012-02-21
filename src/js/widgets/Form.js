// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery', 'uijet_dir/widgets/Base'], function (uijet, $) {
            return factory(uijet, $);
        });
    } else {
        factory(uijet, jQuery);
    }
}(function (uijet, $) {
    uijet.Widget('Form', {
        options         : {
            type_class  : 'uijet_form'
        },
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
                _url = this.getSendUrl(),
                _data = this.getSerialized();
            this.notify('pre_send');
            // if `route_send` is `true`
            if ( uijet.options.routed && this.options.route_send ) {
                // run the URL as a route
                this.runRoute(_url + _data, true);
                return this;
            }
            // otherwise make an XHR
            return $.ajax(_url, {
                type    : this.$element.attr('method'),
                data    : _data,
                context : this
            }).done(function (response) {
                // process and store the response
                this.setData(response);
                // notify `post_send_data` signal
                this.notify('post_send_data', response);
                // publish `post_send_data` event of this widget sandbox-wide
                this.publish('post_send_data', this.data);
            }).fail(function () {
                // emit the `send_error` signal
                this.notify.apply(that, ['send_error'].concat(Array.prototype.slice.call(arguments)));
            }).always(function () {
                // always call `_finally` at the end
                this._finally();
            });
        },
        register        : function () {
            var that = this,
                $el = this.$element,
                // check for the method
                method = $el.attr('method') || 'get',
                // check for the route in the 'action' attribute
                route = $el.attr('action'),
                is_routed = uijet.options.routed,
                is_send_routed = is_routed && this.options.route_send,
                route_obj = {method: method, path: route},
                topic = method + '.' + route;
            // if `route_send` option is set to `true`
            if ( ! is_send_routed ) {
                if ( is_routed ) {
                    // set as route
                    uijet.setRoute(this, route_obj, 'send');
                } else {
                    // set as event
                    uijet.subscribe(topic, this.send, this);
                }
            }
            // check if there's no one else handling the form submit event, e.g. Sammy.js
            if ( ! uijet.options.submit_handled ) {
                $el.bind('submit', function (e) {
                    // stop and prevent it
                    e.preventDefault();
                    e.stopPropagation();
                    if ( is_send_routed ) {
                        // just call `send` and bypass regular submission channels
                        that.send();
                    } else {
                        is_routed ? that.runRoute(route_obj, true) : that.publish(topic);
                    }
                });
            }
            this._super();
            return this;
        },
        appear          : function () {
            var $inputs;
            this._super();
            // on iOS devices the element.focus() method is broken  
            // if `dont_focus` option is not set to `true`
            if ( ! this.options.dont_focus ) {
                // find first `<input>` and focus on it
                $inputs = this.$element.find('input');
                $inputs.length && $inputs.get(0).focus();
            }
            return this;
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
        // override the base method if it's overridden by mixins
        getDataUrl      : function () {
            return this.options.data_url;
        },
        // ### widget.getSendUrl
        // @sign: getSendUrl()
        // @return: send_url
        //
        // Gets the URL used to either route the serialized form or to send it via XHR to server.
        getSendUrl      : function () {
            return this.options.send_url;
        },
        // ### widget.getSerialized
        // @sign: getSerialized()
        // @return: serialized_url_params
        //
        // Serializes the `$element` and returns the params' string.
        getSerialized   : function () {
            return this.$element.serialize();
        },
        // ### widget.clearErrors
        // @sign: clearErrors()
        // @return: this
        //
        // Clears error messages in the DOM.
        clearErrors     : function () {
            // looks for elements with `error` `class` and empties them.
            this.$element.find('.error').empty();
            return this;
        }
    });
}));