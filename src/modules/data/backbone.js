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

    uijet.Base.extend(Backbone.Events);

    uijet.use({
        data: {
            Model       : Backbone.Model.extend.bind(Backbone.Model),
            Collection  : Backbone.Collection.extend.bind(Backbone.Collection)
        }
    });
}));