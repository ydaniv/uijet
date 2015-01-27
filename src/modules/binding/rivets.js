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
            this._super.apply(this, arguments);


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

            return this._super.apply(this, arguments);
        },
        /**
         * Binds the data to the view.
         *
         * The bound view is cached on the instance in `this.rv_view`.
         *
         * #### Related options:
         * * `observe`: map, or a function returning one, of model names to use in bindings to the objects they observe.
         * It's also possible to set it to a `string` which will be used as a reference for the instance's `context`.
         * If a value in that map is a `string` it is used to fetch a registered resource.
         * If that value is `'this'` or a `boolean` it will be mapped to the instance's `context`.
         * * `resource`: if it's a `string` it will be added to view's observables.
         * * `bind_options`: config object passed to {@link http://www.rivetsjs.com/docs/#getting-started-creating-views|Rivets.bind()}.
         *
         * @see {@link http://www.rivetsjs.com/docs/}
         * @method module:binding/rivets#bindData
         * @returns {Widget} this
         */
        bindData: function () {
            var observables = uijet.utils.returnOf(this.options.observe, this),
                resource = this.options.resource,
                k, observable;

            // if observe option is not set but we have a resource option set
            if ( ! observables && resource ) {
                // if resource is a name in resources registry
                if ( typeof resource == 'string' ) {
                    observables = {};
                    // add it to observables under its name
                    observables[resource] = this.resource || uijet.Resource(resource);
                }
                else {
                    // implicitly skip
                    // we're probably handling observation in a higher level, i.e. "each-" binding
                    return this;
                }
            }

            // if we have observables
            if ( observables ) {
                if ( uijet.utils.isObj(observables) ) {
                    for ( k in observables ) {
                        observable = observables[k];
                        // if we have an observable that maps to a name
                        if ( typeof observable == 'string' ) {
                            if ( observable === 'this' ) {
                                observables[k] = this.getContext();
                            }
                            else {
                                // use that name to fetch a resource
                                observables[k] = uijet.Resource(observable);
                            }
                        }
                        else if ( typeof observable == 'boolean' ) {
                            observables[k] = this.getContext();
                        }
                    }
                }
                else if ( typeof observables == 'string' ) {
                    k = observables;
                    observables = {};
                    observables[k] = this.getContext();
                }

                // bind and hold on to the bound view
                this.rv_view = rivets.bind(this.$wrapper || this.$element, observables, this.options.bind_options);
            }
            return this;
        }
    });

    return rivets;
}));
