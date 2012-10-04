// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'sammy'], function (uijet) {
            return factory(uijet);
        });
    } else {
        uijet.pubusb = factory(uijet);
    }
}(this, function (uijet) {
    return function (app) {
        // cache reference to Array's slice method
        var arraySlice = window.Array.prototype.slice;

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
                app._unlisten(topic, handler);
                return this;
            }
        });
    };
}));