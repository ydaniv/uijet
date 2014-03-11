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
        baseRegister = base_widget_proto.register,
        baseGetContext = base_widget_proto.getContext,
        baseDestroy = base_widget_proto.destroy;

    uijet.Base.extend(Backbone.Events);

    uijet.use({
        register        : function () {
            var resource_name = this.options.resource_name,
                dont_merge_resource = this.options.dont_merge_resource,
                resource;
            baseRegister.call(this);

            if ( resource = this.options.resource ) {
                if ( typeof resource == 'string' ) {
                    this.resource = uijet.Resource(resource);
    
                    if ( ! resource_name ) {
                        resource_name = resource;
                    }
                }
                else {
                    this.resource = resource;
    
                    if ( ! resource_name ) {
                        resource_name = this.id + '_data';
                    }
                }

                this.getContext = function () {
                    var context = baseGetContext.call(this),
                        result_set;
                    if ( this.resource instanceof Backbone.Collection ) {
                        if ( context.where && uijet.utils.isObj(context.where) ) {
                            result_set = this.resource.where(context.where);
                        }
                        else if ( context.filter && uijet.utils.isFunc(context.filter) ) {
                            result_set = this.resource.filter(context.filter, this);
                        }
                        else if ( typeof context.filter == 'string' ) {
                            result_set = this.resource[context.filter].apply(this.resource, context.filter_args);
                        }
                        else if ( 'filtered' in context ) {
                            result_set = context.filtered;
                        }
                        else {
                            result_set = this.resource.models;
                        }
                        this.setContext(resource_name, result_set);
                    }
                    else {
                        dont_merge_resource ?
                            this.setContext(resource_name, this.resource.attributes) :
                            this.setContext(this.resource.attributes);
                    }
                    return context;
                };

                this.bindDataEvents();
            }

            return this;
        },
        sort            : function (sorting) {
            if ( sorting in this.options.sorting ) {
                this.resource.comparator = this.options.sorting[sorting];
                this.resource.sort();
            }
            return this;
        },
        bindDataEvents  : function () {
            var bindings, type, handler;

            bindings = 'data_events' in this.options ?
                this.options.data_events :
                uijet.options.data_events;

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
            return this;
        },
        unbindDataEvents: function (resource, type, handler) {
            this.stopListening(resource || this.resource, type, handler);
            return this;
        },
        setResource     : function (resource, resource_name) {
            this.resource && this.unbindDataEvents();
            this.resource = resource;
            if ( resource_name || typeof this.options.resource == 'string' ) {
                uijet.Resource(resource_name || this.options.resource, resource, true);
            }
            this.bindDataEvents();
            return this;
        },
        destroy         : function (remove_only) {
            if ( this.resource ) {
                var collection;

                if ( ! remove_only ) {
                    this.resource.destroy();
                }

                else if ( collection = this.resource.collection ) {
                    collection.remove(this.resource);
                }
            }

           baseDestroy.call(this);

            delete this.resource;
        }
    }, base_widget_proto)

    .use({
        Model       : Backbone.Model.extend.bind(Backbone.Model),
        Collection  : Backbone.Collection.extend.bind(Backbone.Collection),
        newResource : function (resource, initial, options) {
            return new resource(initial, options);
        }
    });

    return Backbone;
}));
