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
     * Rivets-Backbone binding module.
     * 
     * @module binding/rivets-backbone
     * @extends uijet.BaseWidget
     * @see {@link http://www.rivetsjs.com/docs/}
     * @see {@link http://backbonejs.org/}
     * @exports Rivets
     */

    /*
     * Configure rivets to work with Backbone.js
     */
    rivets.adapters[':'] = {
        subscribe  : function (obj, keypath, callback) {
            if ( obj instanceof Backbone.Collection ) {
                obj.on('add remove reset sort', callback);
            }
            else {
                obj.on('change:' + keypath, callback);
            }
        },
        unsubscribe: function (obj, keypath, callback) {
            if ( obj instanceof Backbone.Collection ) {
                obj.off('add remove reset sort', callback);
            }
            else {
                obj.off('change:' + keypath, callback);
            }
        },
        read       : function (obj, keypath) {
            if ( obj instanceof Backbone.Collection ) {
                return obj[keypath];
            }
            else {
                return obj.get(keypath);
            }
        },
        publish    : function (obj, keypath, value) {
            if ( obj instanceof Backbone.Model ) {
                obj.set(keypath, value);
            }
        }
    };

    uijet.utils.extendProto(uijet.BaseWidget.prototype, {
        /**
         * Triggers data binding on `init()`.
         * 
         * #### Related options:
         * 
         * * `dont_bind`: if `true` prevents from `bindData()` to be invoked here during `init()` stage.
         * If this instance is `templated` then `bindData()` is never called here.
         * 
         * @method module:binding/rivets-backbone#register
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
         * @method module:binding/rivets-backbone#destroy
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
         * If a value in that map is a `string` it is used to fetch a registered resource.
         * For every list of existing observables the widget's instance is added under the key of `this.id`.
         * * `resource`: if it's a `string` it will be added to view's observables.
         * * `bind_options`: config object passed to {@link http://www.rivetsjs.com/docs/#getting-started-creating-views|Rivets.bind()}.
         * 
         * @see {@link http://www.rivetsjs.com/docs/}
         * @method module:binding/rivets-backbone#bindData
         * @returns {Widget} this
         */
        bindData: function () {
            var observables = uijet.utils.returnOf(this.options.observe, this),
                k, observable;

            // if observe option is not set but we have a resource option set
            if ( ! observables && this.options.resource ) {

                observables = {};

                // if resource is a name in resources registry
                if ( typeof this.options.resource == 'string' ) {
                    // add it to observables under its name 
                    observables[this.options.resource] = this.resource || uijet.Resource(this.options.resource);
                }
                else {
                    // implicitly skip
                    // we're probably handling observation in a higher level, i.e. "each-/repeat-" binding
                    return this;
                }
            }

            // if we have observables
            if ( observables ) {
                for ( k in observables ) {
                    observable = observables[k];
                    // if we have an observable that maps to a name
                    if ( typeof observable == 'string' ) {
                        // use that name to fetch a resource
                        observables[k] = uijet.Resource(observable);
                    }
                }
                // finally add the instance under its id to observables, to use it a bit like a ViewModel
                observables[this.id] = this;

                // bind and hold on to the bound view
                this.rv_view = rivets.bind(this.$wrapper || this.$element, observables, this.options.bind_options);
            }
            return this;
        }
    });

    return rivets;
}));
