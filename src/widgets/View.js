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
        switchView = function (view) {
            if ( current_view && current_view !== view ) {
                current_view.sleep();
            }
            current_view = view;
        };

    uijet.Widget('View', {
        options : {
            type_class  : 'uijet_view'
        },
        register: function () {
            this._super();
            // check if this is the current screen
            this.checkState();
            if ( this.options.state == 'current' ) {
                switchView(this);
            }
            return this;
        }
    }, ['Layered', 'Routed']);
}));
