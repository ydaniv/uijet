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

    var baseRegister = uijet.BaseWidget.prototype.register;

    uijet.Base.extend(Backbone.Events);

    uijet.BaseWidget.prototype.register = function () {
        var default_events = { change : 'render' },
            resource, bindings, type, handler;
        baseRegister.call(this);

        if ( resource = this.options.resource ) {
            this.resource = new (uijet.Resource(resource));

            bindings = 'data_events' in this.options ?
                this.options.data_events :
                uijet.options.data_events ?
                    uijet.options.data_events :
                    default_events;
            if ( bindings ) {
                for ( type in bindings ) {
                    handler = bindings[type];
                    if ( typeof handler == 'string' ) {
                        handler = this[handler];
                    }
                    this.listenTo(this.resource, type, handler);
                }
            }
        }

        return this;
    };

    uijet.use({
        Model       : Backbone.Model.extend.bind(Backbone.Model),
        Collection  : Backbone.Collection.extend.bind(Backbone.Collection)
    });

    return Backbone;
}));