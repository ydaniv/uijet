// ### AMD wrapper
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
    uijet.Widget('View', {
        options : {
            type_class  : 'uijet_view'
        },
        register: function () {
            this._super();
            // register this view using `uijet.View`
            uijet.View(this.id, this);
            // check if this is the current screen
            this.checkState();
            return this;
        }
    }, ['Layered', 'Routed']);
}));