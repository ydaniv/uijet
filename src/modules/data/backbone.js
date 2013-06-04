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
                if ( this.context ) {
                    if ( uijet.Utils.isObj(this.context) ) {
                        return this.resource.where(this.context);
                    }
                    else if ( typeof this.context == 'string' &&
                        uijet.Utils.isFunc(this.resource[this.context]) ) {
                        return this.resource[this.context]();
                    }
                }
                return this.resource.toJSON();
            };
            this.update = function (fetch_options) {
                var that = this,
                    options = fetch_options || {},
                    dfrd_update, _success;
                // if the pre_update signal returned `false` then bail
                if ( this.notify('pre_update') === false ) return {};
                // since this may take more then a few miliseconds then publish the `pre_load` event to allow the UI
                // to respond to tasks that require a long wait from the user
                uijet.publish('pre_load');
                // our update promise object
                dfrd_update = uijet.Promise();
                _success = function (model, response) {
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
                    var _abort_fail = that.notify.apply(that, ['update_error'].concat(Array.prototype.slice.call(arguments), _success.bind(that)));
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
        newResource : function (resource, initial) {
            return new resource(initial);
        }
    });

    return Backbone;
}));
