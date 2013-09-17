(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'backbone',
            'uijet_dir/widgets/Base'
        ], function (uijet, Backbone) {
            return factory(uijet, Backbone);
        });
    } else {
        factory(uijet, root.Backbone);
    }
}(this, function (uijet, Backbone) {

    var arraySlice = Array.prototype.slice,
        base_widget_proto = uijet.BaseWidget.prototype,
        baseRegister = base_widget_proto.register,
        baseDestroy = base_widget_proto.destroy;

    uijet.Base.extend(Backbone.Events);

    base_widget_proto.register = function () {
        var default_events = { change : 'render' },
            resource, bindings, type, handler;
        baseRegister.call(this);

        if ( resource = this.options.resource ) {
            this.resource = typeof resource == 'string' ?
                uijet.Resource(resource) :
                resource;

            this.getData = function () {
                if ( this.filtered ) {
                    if ( uijet.utils.isFunc(this.filtered) ) {
                        this.filtered = this.filtered();
                    }
                    return this.filtered;
                }
                else if ( this.context ) {
                    if ( uijet.utils.isObj(this.context) ) {
                        return this.resource.where ?
                            this.resource.where(this.context) :
                            uijet.utils.extend({}, this.context, this.resource.attributes);
                    }
                    else if ( typeof this.context == 'string' &&
                        uijet.utils.isFunc(this.resource[this.context]) ) {
                        return this.resource[this.context]();
                    }
                }
                return this.resource.models || this.resource.attributes;
            };
            this.filter = function () {
                var args = arraySlice.call(arguments, 1),
                    is_lazy = false,
                    filter = arguments[0];
                if ( uijet.utils.isFunc(filter) ) {
                    is_lazy = true;
                }
                this.filtered = is_lazy ?
                    filter.apply.bind(filter, this.resource, args) :
                    filter;
                return this;
            };
            this.sort = function (sorting) {
                if ( sorting in this.options.sorting ) {
                    this.resource.comparator = this.options.sorting[sorting];
                    this.resource.sort();
                }
                return this;
            };
            this.update = function (fetch_options) {
                var that = this,
                    options = uijet.utils.extend(this.options.fetch_options || {}, fetch_options || {}),
                    dfrd_update, _success;
                // if the pre_update signal returned `false` then bail
                if ( this.options.dont_fetch || this.notify('pre_update') === false ) return {};
                // since this may take more then a few miliseconds then publish the `pre_load` event to allow the UI
                // to respond to tasks that require a long wait from the user
                uijet.publish('pre_load');
                // our update promise object
                dfrd_update = uijet.Promise();
                _success = function (response, response, options) {
                    that.has_data = true;
                    // if success notify a signal that we have `data` and resolve the promise
                    that.notify('post_fetch_data', response);
                    dfrd_update.resolve();
                };

                options.success = _success;
                options.error = function (response) {
                    // notify there was an error and allow user to continue with either:
                    //
                    // * __success flow__: success callback is sent as the last argument to the signal's handler
                    // * __failrue flow__: in case anything but `false` is returned from `update_error` handler
                    // * __or abort it all__: return `false` from `update_error` handler
                    var _abort_fail = that.notify.apply(that, ['update_error'].concat(arraySlice.call(arguments), _success.bind(that)));
                    if ( _abort_fail !== false ) {
                        // publish an error has occurred with `update`
                        that.publish('update_error', response, true);
                        dfrd_update.reject(response);
                    }
                };
                this.resource.fetch(options);

                return dfrd_update.promise();
            };

            bindings = 'data_events' in this.options ?
                this.options.data_events :
                uijet.options.data_events ?
                    uijet.options.data_events :
                    default_events;

            if ( bindings ) {
                var that = this,
                    is_global = false,
                    _h;
                for ( type in bindings ) {
                    handler = bindings[type];
                    if ( typeof handler == 'string' ) {
                        if ( uijet.utils.isFunc(this[handler]) ) {
                            handler = this[handler];
                        }
                        else {
                            _h = handler;
                            if ( _h[0] == '-' ) {
                                is_global = true;
                                _h = _h.slice(1);
                            }
                            (function (_type, name, global) { 
                                var _handler = function () {
                                    var args = uijet.utils.toArray(arguments);
                                    (global ? uijet : that).publish.call(that, name, {args : args});
                                };
                                that.listenTo(that.resource, _type, _handler);
                            }(type, _h, is_global));
                            continue;
                        }
                    }
                    this.listenTo(this.resource, type, handler);
                }
            }
        }

        return this;
    };
    base_widget_proto.destroy = function () {
        baseDestroy.call(this);
        delete this.resource;
    };

    uijet.use({
        Model       : Backbone.Model.extend.bind(Backbone.Model),
        Collection  : Backbone.Collection.extend.bind(Backbone.Collection),
        newResource : function (resource, initial, options) {
            return new resource(initial, options);
        }
    });

    return Backbone;
}));
