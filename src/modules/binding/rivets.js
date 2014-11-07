(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'rivets',
            'uijet_dir/widgets/Base'
        ], function (uijet, rivets) {
            return factory(uijet, rivets);
        });
    }
    else {
        factory(uijet, root.rivets);
    }
}(this, function (uijet, rivets) {

    var base_publish = rivets.adapters['.'].publish,
        base_subscribe = rivets.adapters['.'].subscribe,
        UIJET_VIEWS_ATTR = '__uijet_views__';

    rivets.adapters['.'].subscribe = function (obj, keypath, callback) {
        var result = base_subscribe.apply(this, arguments);
        console.log(obj, keypath, callback);
        return result
    };
    rivets.adapters['.'].publish = function (obj, keypath, value) {
        var result = base_publish.apply(this, arguments),
            views = obj[UIJET_VIEWS_ATTR],
            i = 0,
            view;
        for ( ; view = views[i]; i++ ) {
            view.notify(keypath, value);
        }
        return result;
    };

    /**
     * Rivets binding module.
     *
     * @module binding/rivets
     * @category Module
     * @sub-category Binding
     * @extends BaseWidget
     * @see {@link http://www.rivetsjs.com/docs/}
     * @exports Rivets
     */
    uijet.utils.extendProto(uijet.BaseWidget.prototype, {
        /**
         * Triggers data binding on `init()`.
         * 
         * #### Related options:
         * 
         * * `dont_bind`: if `true` prevents from `bindData()` to be invoked here during `init()` stage.
         * If this instance is `Templated` then `bindData()` is never called here.
         * 
         * @method module:binding/rivets#register
         * @returns {Widget} this
         */
        register: function () {
            var resource, resource_name;
            this._super.apply(this, arguments);

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

            if ( ! this.options.dont_bind && ! this.templated ) {
                this.bindData();
            }

            return this;
        },
        /**
         * Unbinds the data from the view
         * 
         * @see {@link http://www.rivetsjs.com/docs/#getting-started}
         * @method module:binding/rivets#destroy
         * @returns {Widget} this
         */
        destroy : function () {
            if ( this.rv_view ) {
                this.rv_view.unbind();
            }
            //TODO: remove this view from all observed resources
//            this._unobserveResource();

            return this._super.apply(this, arguments);
        },
        /**
         * Binds the data to the view.
         * 
         * The bound view is cached on the instance in `this.rv_view`.
         * 
         * #### Related options:
         * * `observe`: map, or a function returning one, of model names to use in bindings to the objects they observe.
         * If a value in that map is a `string` it is used to fetch a registered resource.
         * For every list of existing observables the widget's instance is added under the key of `this.id`.
         * * `resource`: if it's a `string` it will be added to view's observables.
         * * `bind_options`: config object passed to {@link http://www.rivetsjs.com/docs/#getting-started-creating-views|Rivets.bind()}.
         * * `observe_self`: if `true` then the instance itself (`this`) will be observed under `this.id` as a namespace.
         * * `observe_context`: if `true` then the instance's context will be observed under `this.id` as a namespace.
         * 
         * @see {@link http://www.rivetsjs.com/docs/}
         * @method module:binding/rivets#bindData
         * @returns {Widget} this
         */
        bindData: function () {
            var observables = uijet.utils.returnOf(this.options.observe, this),
                add_self = this.options.observe_self,
                resource = this.options.resource,
                k, observable;

            // if observe option is not set
            if ( ! observables ) {

                observables = {};

                // resource IS option set
                if ( resource ) {
                    // if resource is a name in resources registry
                    if ( typeof resource == 'string' ) {
                        // add it to observables under its name 
                        observables[resource] = this.resource || uijet.Resource(resource);
//                        this._observeResource(observables[resource]);
                    }
                    else {
//                        this._observeResource(resource);
                        // implicitly skip
                        // we're probably handling observation in a higher level, i.e. "each-/repeat-" binding
                        return this;
                    }
                }
            }

            if ( this.options.observe_context ) {
                observables[this.id] = this.getContext();
                add_self = false;
            }

            // if we have observables
            if ( observables ) {
                for ( k in observables ) {
                    observable = observables[k];
                    // if we have an observable that maps to a name
                    if ( typeof observable == 'string' ) {
                        // use that name to fetch a resource
                        observables[k] = observable = uijet.Resource(observable);
                    }
//                    this._observeResource(observable);
                }

                if ( add_self ) {
                    // finally add the instance under its id to observables, to use it a bit like a ViewModel
                    observables[this.id] = this;
                }

                // bind and hold on to the bound view
                this.rv_view = rivets.bind(this.$wrapper || this.$element, observables, this.options.bind_options);
            }
            return this;
        },
        bindDataEvents  : function () {
            var bindings = 'data_events' in this.options ?
                    this.options.data_events : uijet.options.data_events,
                keypath;

            if ( bindings ) {
                for ( keypath in bindings ) {
                    if ( bindings.hasOwnProperty(keypath) ) {
                        this.listen(keypath, bindings[keypath]);
                    }
                }
            }
            return this;
        },
        _observeResource: function (resource) {
            var views;

            resource = resource || this.resource;

            if ( ! (views = resource[UIJET_VIEWS_ATTR]) ) {
                views = resource[UIJET_VIEWS_ATTR] = [];
            }
            if ( !~views.indexOf(this) ) {
                views.push(this);
            }
            return this;
        },
        _unobserveResource: function (resource) {
            var views, index;

            resource = resource || this.resource;

            if ( views = resource[UIJET_VIEWS_ATTR] ) {
                index = views.indexOf(this);
                if ( ~ index ) {
                    views.splice(index, 1);
                }
            }
            return this;
        }
    });

    return rivets;
}));
