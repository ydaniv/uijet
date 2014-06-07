(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/mixins/Layered',
            'uijet_dir/mixins/Routed'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    var current_view,
        /**
         * Calls `sleep()` on current active view and caches
         * `view` in its place.
         * 
         * @function View~switchView
         * @param {View} view - the new View instance to cache as current active view.
         * @inner
         */
        switchView = function (view) {
            if ( current_view && current_view !== view ) {
                current_view.sleep();
            }
            current_view = view;
        };

    /**
     * View widget class.
     * 
     * @class View
     * @category Widget
     * @extends BaseWidget
     * @mixes Layered
     * @mixes Routed
     */
    uijet.Widget('View', {
        options : {
            type_class  : 'uijet_view'
        },
        /**
         * Needed for caching the initial active view.
         * 
         * #### Related options:
         * 
         * * `state`: if set to `'current'` then caches this instance as the currently active view.
         * 
         * @memberOf View
         * @instance
         * @returns {View}
         */
        register: function () {
            this._super();
            if ( this.options.state == 'current' ) {
                switchView(this);
            }
            return this;
        }
    }, ['Layered', 'Routed']);
}));
