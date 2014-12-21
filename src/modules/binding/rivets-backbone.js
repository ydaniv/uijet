(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'rivets',
            'uijet_dir/modules/data/backbone'
        ], function (uijet, rivets) {
            return factory(uijet, rivets);
        });
    }
    else {
        factory(uijet, root.rivets);
    }
}(this, function (uijet, rivets, Backbone) {

    var _views_cache = {};

    uijet.use({
        __getRvView: function (id) {
            return _views_cache[id];
        }
    });

    /**
     * Rivets-Backbone binding module.
     * 
     * @module binding/rivets-backbone
     * @category Module
     * @sub-category Binding
     * @extends BaseWidget
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
         * Removes this instance's Rivets view from cache.
         * 
         * @method module:binding/rivets-backbone#destroy
         * @returns {Widget} this
         */
        destroy : function () {
            _views_cache[this.id] = null;

            return this._super.apply(this, arguments);
        },
        /**
         * Caches this instance's Rivets view.
         * 
         * @method module:binding/rivets-backbone#bindData
         * @returns {Widget} this
         */
        bindData: function () {
            this._super.apply(this, arguments);

            _views_cache[this.id] = this.rv_view;

            return this;
        }
    });

    return rivets;
}));
