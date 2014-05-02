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

    /**
     * Backbone data module.
     * 
     * @module data/backbone
     * @extends uijet
     * @see {@link http://backbonejs.org/}
     * @exports Backbone
     */
    var base_widget_proto = uijet.BaseWidget.prototype,
        baseRegister = base_widget_proto.register,
        baseGetContext = base_widget_proto.getContext,
        baseDestroy = base_widget_proto.destroy;

    uijet.Base.extend(Backbone.Events);

    /**
     * Extends the Transitioned mixin to leverage this
     * animation module.
     * 
     * @name data/backbone.Resourced
     * @extends Resourced
     */
    uijet.use({
        /**
         * Assigns the resource to `this.resource` and enhances {@link BaseWidget#getContext}
         * to integrate with `Backbone.Model` and `Backbone.Collection`.
         * 
         * Binds the data events.
         * 
         * @method module:data/backbone.Resourced#register
         * @returns {Widget} this
         */
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
        /**
         * Sets the resource's (Collection's) `comparator` and forces sorting
         * by calling its {@link http://backbonejs.org/#Collection-sort|sort} method.
         * 
         * #### Related options:
         * 
         * * `sorting`: map of predefined `comparator` functions/strings that can be used to sort the resource.
         * 
         * @see {@link http://backbonejs.org/#Collection-comparator}
         * @method module:data/backbone.Resourced#sort
         * @param {string} sorting - a key to match a predefined sorting comparator.
         * @returns {Widget} this
         */
        sort            : function (sorting) {
            if ( sorting in this.options.sorting ) {
                this.resource.comparator = this.options.sorting[sorting];
                this.resource.sort();
            }
            return this;
        },
        /**
         * Binds all data events set in `options.data_events`.
         * 
         * ### Supported events:
         * 
         * * {@type string}: a name of a widget's method. Defaults to publishing an event that takes the arguments in
         * a single array as the `data` param. Also respects the `'-'` prefix for global events.
         * * {@type function}: a function to use as the handler.
         * 
         * #### Related options:
         * 
         * * `data_events`: ths events to bind.
         * 
         * #### Related uijet options:
         * 
         * * `data_events`: if the instance's `data_events` option is not set, this wii be used as default.
         * 
         * @see {@link http://backbonejs.org/#Events-listenTo}
         * @method module:data/backbone.Resourced#bindDataEvents
         * @returns {Widget} this
         */
        bindDataEvents  : function () {
            var bindings, type, handler;

            bindings = 'data_events' in this.options ?
                this.options.data_events :
                uijet.options.data_events;

            if ( bindings ) {
                var is_global = false,
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
                                    (global ? uijet : this).publish.call(this, name, arguments);
                                }.bind(this);
                                this.listenTo(this.resource, _type, _handler);
                            }.call(this, type, _h, is_global));
                            continue;
                        }
                    }
                    this.listenTo(this.resource, type, handler);
                }
            }
            return this;
        },
        /**
         * Unbinds all data events handlers registered with this instance. 
         * 
         * @see {@link http://backbonejs.org/#Events-stopListening}
         * @method module:data/backbone.Resourced#unbindDataEvents
         * @param {Model|Collection} [resource] - a resource to stop listening to. Defaults to `this.resource`.
         * @returns {Widget} this
         */
        unbindDataEvents: function (resource) {
            this.stopListening(resource || this.resource);
            return this;
        },
        /**
         * Sets a given resource instance to this widget, and also updates
         * resources registry, so that all other widgets requesting this
         * resource get it.
         * 
         * #### Related options:
         * 
         * * `resource`: used as the default for `resource_name` param.
         * 
         * @method module:data/backbone.Resourced#setResource
         * @param {Model|Collection} resource - a new instance of a resource to use as this widget's resource.
         * Also updates registry with this instance.
         * @param {string} [resource_name] - the name this resource is to be registered under.
         * Defaults to `this.options.resource`.
         * @returns {Widget} this
         */
        setResource     : function (resource, resource_name) {
            this.resource && this.unbindDataEvents();
            this.resource = resource;
            if ( resource_name || typeof this.options.resource == 'string' ) {
                uijet.Resource(resource_name || this.options.resource, resource, true);
            }
            this.bindDataEvents();
            return this;
        },
        /**
         * If this resource is a `Model` also handles
         * destroying it, or simply removing it from containing
         * collection.
         * 
         * @see {@link http://backbonejs.org/#Model-destroy}
         * @method module:data/backbone.Resourced#destroy
         * @param {boolean} [remove_only] - if `true` will not invoke the resource's destroy method.
         * @returns {Widget} this
         */
        destroy         : function (remove_only) {
            if ( this.resource instanceof Backbone.Model ) {
                var collection;

                if ( ! remove_only ) {
                    // by default also delegates to the resource's destroy method
                    this.resource.destroy();
                }
                // otherwise, if part of a colletction
                else if ( collection = this.resource.collection ) {
                    // just remove from it from its collection
                    collection.remove(this.resource);
                }
            }

           var res = baseDestroy.apply(this, arguments);

            this.resource = null;

            return res;
        }
    }, base_widget_proto)

    .use({
        /**
         * Defines and creates a model's class extending {@link http://backbonejs.org/#Model|Backbone.Model}.
         * 
         * @see {@link http://backbonejs.org/#Model-extend}
         * @memberOf module:data/backbone
         * @param {Object} properties - instance properties to add to this model.
         * @param {Object} [class_properties] - class properties to add to this model.
         * @returns {Model}
         */
        Model       : Backbone.Model.extend.bind(Backbone.Model),
        /**
         * Defines and creates a collection's class extending
         * {@link http://backbonejs.org/#Collection|Backbone.Collection}.
         * 
         * @see {@link http://backbonejs.org/#Collection-extend}
         * @memberOf module:data/backbone
         * @param {Object} properties - instance properties to add to this collection.
         * @param {Object} [class_properties] - class properties to add to this collection. 
         * @returns {Collection}
         */
        Collection  : Backbone.Collection.extend.bind(Backbone.Collection),
        /**
         * Instantiates a Backbone Model/Collection.
         * 
         * @param {function} resource - the resource's constructor.
         * @param {Object|Array|null} [initial] - initial data to use to initialize the resource.
         * @param {Object} [options] - valid options for Backbone's Models/Collections construction.
         * @returns {Model|Collection} - new resource instance.
         */
        newResource : function (resource, initial, options) {
            return new resource(initial, options);
        }
    });

    return Backbone;
}));
