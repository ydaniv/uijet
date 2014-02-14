(function ( root, factory ) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'rivets',
            'uijet_dir/widgets/Base'
        ], function ( uijet, rivets ) {
            return factory(uijet, rivets);
        });
    }
    else {
        factory(uijet, root.rivets);
    }
}(this, function ( uijet, rivets ) {

    /*
     * Configure rivets to work with Backbone.js
     */
    rivets.adapters[':'] = {
        subscribe  : function ( obj, keypath, callback ) {
            if ( obj instanceof Backbone.Collection ) {
                obj.on('add remove reset sort', callback);
            }
            else {
                obj.on('change:' + keypath, callback);
            }
        },
        unsubscribe: function ( obj, keypath, callback ) {
            if ( obj instanceof Backbone.Collection ) {
                obj.off('add remove reset sort', callback);
            }
            else {
                obj.off('change:' + keypath, callback);
            }
        },
        read       : function ( obj, keypath ) {
            if ( obj instanceof Backbone.Collection ) {
                return obj[keypath];
            }
            else {
                return obj.get(keypath);
            }
        },
        publish    : function ( obj, keypath, value ) {
            if ( obj instanceof Backbone.Model ) {
                obj.set(keypath, value);
            }
        }
    };

    var base_widget_proto = uijet.BaseWidget.prototype, baseRegister = base_widget_proto.register, baseDestroy = base_widget_proto.destroy;

    base_widget_proto.register = function () {
        baseRegister.call(this);

        var observables = uijet.utils.returnOf(this.options.observe, this),
            k, observable;

        if ( this.options.resource ) {

            if ( ! observables ) {
                observables = {};
            }
            if ( typeof this.options.resource == 'string' ) {
                observables[this.options.resource] = this.resource || uijet.Resource(this.options.resource);
            }
            else {
                // implicitly skip
                return this;
            }
        }

        if ( observables ) {
            for ( k in observables ) {
                observable = observables[k];
                if ( typeof observable == 'string' ) {
                    observables[k] = uijet.Resource(observable);
                }
            }
            observables[this.id] = this;

            this.rv_view = rivets.bind(this.$wrapper || this.$element, observables, this.options.bind_options);
        }


        return this;
    };

    base_widget_proto.destroy = function () {
        if ( this.rv_view ) {
            this.rv_view.unbind();
        }

        return baseDestroy.apply(this, arguments);
    };

    return rivets;
}));
