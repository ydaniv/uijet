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
         * Binds `data_events` of the resource to the instance.
         *
         * #### Related options:
         *
         * * `dont_bind_data_events`: used internally to delay auto-binding of `data_events`
         * to allow binding those later manually. Normally you should not touch this option.
         *
         * @method module:data/backbone.Resourced#register
         * @returns {Widget} this
         */
        register        : function () {
            this._super.apply(this, arguments);

            if ( ! this.options.dont_bind_data_events ) {
                this.bindDataEvents();
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
         * removing it from containing collection, or
         * destroying it if asked to.
         *
         * #### Related options:
         *
         * * `destroy_resource`: Tells the widget to call `destroy()` on its resource. Defaults to `false`.
         * * `remove_resource`: Tells the widget to `remove()` its resource from its related collection. Defaults to `false`.
         *
         * @see {@link http://backbonejs.org/#Model-destroy}
         * @method module:data/backbone.Resourced#destroy
         * @returns {Widget} this
         */
        destroy         : function () {
            if ( this.resource instanceof Backbone.Model ) {
                var collection = this.resource.collection;

                if ( this.options.destroy_resource ) {
                    // by default also delegates to the resource's destroy method
                    this.resource.destroy();
                }
                // otherwise, if part of a colletction
                else if ( collection && this.options.remove_resource ) {
                    // just remove from it from its collection
                    collection.remove(this.resource);
                }
            }
            this.stopListening();

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
