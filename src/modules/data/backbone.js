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

    var base_widget_proto = uijet.BaseWidget.prototype,
        baseRegister = base_widget_proto.register;

    uijet.Base.extend(Backbone.Events);

    base_widget_proto.register = function () {
        var default_events = { change : 'render' },
            resource, bindings, type, handler;
        baseRegister.call(this);

        if ( resource = this.options.resource ) {
            this.resource = uijet.Resource(resource);

            this.getData = function () {
                return this.resource.toJSON();
            };
            this.update = function (request_data) {
                var that = this,
                    dfrd_update, _success;
                // if the pre_update signal returned `false` then bail
                if ( this.notify('pre_update') === false ) return {};
                // since this may take more then a few miliseconds then publish the `pre_load` event to allow the UI
                // to respond to tasks that require a long wait from the user
                uijet.publish('pre_load');
                // our update promise object
                dfrd_update = uijet.Promise();
                _success = function (model, response) {
                    this.has_data = true;
                    // if success notify a signal that we have `data` and resolve the promise
                    that.notify('post_fetch_data', response);
                    dfrd_update.resolve();
                };

                this.resource.fetch({
                    success : _success,
                    error   : function (response) {
                        // notify there was an error and allow user to continue with either:
                        //
                        // * __success flow__: success callback is sent as the last argument to the signal's handler
                        // * __failrue flow__: in case anything but `false` is returned from `update_error` handler
                        // * __or abort it all__: return `false` from `update_error` handler
                        var _abort_fail = that.notify.apply(that, ['update_error'].concat(Array.prototype.slice.call(arguments), _success.bind(that)));
                        if ( _abort_fail !== false ) {
                            // publish an error has occurred with `update`
                            that.publish('update_error', response, true);
                            dfrd_update.reject(response);
                        }
                    }
                });
                return dfrd_update.promise();
            };

            bindings = 'data_events' in this.options ?
                this.options.data_events :
                uijet.options.data_events ?
                    uijet.options.data_events :
                    default_events;

            if ( bindings ) {
                for ( type in bindings ) {
                    handler = bindings[type];
                    if ( typeof handler == 'string' ) {
                        handler = this[handler];
                    }
                    this.listenTo(this.resource, type, handler);
                }
            }
        }

        return this;
    };

    uijet.use({
        Model       : Backbone.Model.extend.bind(Backbone.Model),
        Collection  : Backbone.Collection.extend.bind(Backbone.Collection),
        newResource : function (resource) {
            return new resource;
        }
    });

    return Backbone;
}));