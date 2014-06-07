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
     * @category Module
     * @sub-category Data
     * @extends uijet
     * @see {@link http://backbonejs.org/}
     * @exports Backbone
     */

    /**
     * Extending {@link uijet.Base} with {@Link http://backbonejs.org/#Events|Backbone.Events}.
     * 
     * @see {@link http://backbonejs.org/#Events}
     */
    uijet.Base.extend(Backbone.Events);

    /**
     * Extends the BaseWidget class to use Backbone's Collection and
     * Models as resources.
     * 
     * @class module:data/backbone.Resourced
     * @category Mixin
     * @extends BaseWidget
     */
    uijet.utils.extendProto(uijet.BaseWidget.prototype, {
        /**
         * Assigns the resource to `this.resource` and enhances {@link BaseWidget#getContext}
         * to integrate with `Backbone.Model` and `Backbone.Collection`.
         * 
         * Binds the data events.
         * 
         * #### Related options:
         * 
         * * `resource_name`: a key to use when referencing the model's attributes form the `context` object.
         * Defaults to the `resource` option if it's a `string`, otherwise to `'<this.id>_data'`.
         * 
         * @method module:data/backbone.Resourced#register
         * @returns {Widget} this
         */
        register        : function () {
            var resource_name = this.options.resource_name,
                resource;
            this._super.call(this);

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

                this._resource_name = resource_name;

                this.bindDataEvents();
            }

            return this;
        },
        /**
         * Gets the `context` object or a specific property in it.
         * 
         * If the instance has a resource it's more likely you'll use
         * the `context` object to store filters to use for querying the
         * resource and use the actual resource to store and get data.
         * 
         * If the resource is a Collection you can use the following:
         * 
         * #### Filter options:
         * 
         * * `where`: argument to delegate to {@link http://backbonejs.org/#Collection-where|Collection.where()}.
         * * `filter`: argument to delegate to {@link http://backbonejs.org/#Collection-filter|Collection.filter()}.
         * The second `context` argument will be the widget's instance. Can be used in 2 variations:
         * * * as `function`: will be used as a filter function run in the instance's context.
         * * * as `string`: to reference a method of the collection to use for filtering.
         * That will be run in the resource's context and handed the arguments given in `filter_args`.
         * * `filter_args`: array of arguments to use in conjunction with `filter` as a `string`.
         * * `filtered`: predefined filtered list of models to use. Can be imported from another resource.
         * 
         * If the resource is a Model you get 2 options:
         * 
         * * `dont_merge_resource`=`true`: a reference to the model's attributes will be added to the `context`
         * object under the key of calculated `resource_name`.
         * * otherwise: the model's attributes will be merged into the `context` object.
         * 
         * #### Related options:
         * 
         * * `dont_merge_resource`: whether to merge the model's attributes to the `context` object or just reference
         * it from there using `resource_name`.
         * * `resource_name`: a key to use when referencing the model's attributes form the `context` object.
         * Defaults to the `resource` option if it's a `string`, otherwise to `'<this.id>_data'`.
         * 
         * @method module:data/backbone.Resourced#getContext
         * @param {string} [key] - string for getting a specific property of the data `context` object.
         * @returns {Object|Model[]}
         */
        getContext      : function (key) {
            var context = this._super(key),
                result_set;
            if ( this.resource ) {
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
                    this.setContext(this._resource_name, result_set);
                }
                else {
                    this.options.dont_merge_resource ?
                        this.setContext(this._resource_name, this.resource.attributes) :
                        this.setContext(this.resource.attributes);
                }
            }
            return context;
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
         * * `string`: a name of a widget's method. Defaults to publishing an event that takes the arguments in
         * a single array as the `data` param. Also respects the `'-'` prefix for global events.
         * * `function`: a function to use as the handler.
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

            var res = this._super.apply(this, arguments);

            this.resource = null;

            return res;
        }
    });

    uijet.use({
        /**
         * Defines and creates a model's class extending {@link http://backbonejs.org/#Model|Backbone.Model}.
         * 
         * @see {@link http://backbonejs.org/#Model-extend}
         * @method module:data/backbone#Model
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
         * @method module:data/backbone#Collection
         * @param {Object} properties - instance properties to add to this collection.
         * @param {Object} [class_properties] - class properties to add to this collection. 
         * @returns {Collection}
         */
        Collection  : Backbone.Collection.extend.bind(Backbone.Collection),
        /**
         * Instantiates a Backbone Model/Collection.
         * 
         * @method module:data/backbone#newResource
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
