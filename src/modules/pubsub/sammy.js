// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'sammy'], function (uijet) {
            return factory(root, uijet);
        });
    } else {
        root.uijet.pubusb = factory(root, uijet);
    }
}(this, function (root, uijet) {
    return function (app) {
        // cache reference to Array's slice method
        var arraySlice = root.Array.prototype.slice;

        uijet.use({
            publish         : function (topic, data) {
                app.trigger(topic, data);
                return this;
            },
            subscribe       : function (topic, handler, context) {
                if ( context && typeof handler == 'string' ) {
                    handler = context[handler];
                }
                app.bind(topic, function wrapper () {
                    // we need to lose the idle first `event` argument
                    var args = arraySlice.call(arguments, 1);
                    return handler.apply(context || this, args);
                });
                return this;
            },
            unsubscribe     : function (topic, handler) {
                //TODO: this probably won't work since we're wrapping all handlers
                app._unlisten(topic, handler);
                return this;
            }
        });
    };
}));