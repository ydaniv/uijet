// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery', 'ba-tinypubsub'], function (uijet, $) {
            return factory(root, uijet, $);
        });
    } else {
        factory(root, uijet, root.jQuery);
    }
}(this, function (root, uijet, $) {
    // cache reference to Array's slice method
    var arraySlice = root.Array.prototype.slice;

    uijet.use({
        publish         : function (topic, data) {
            $.publish(topic, data);
            return this;
        },
        subscribe       : function (topic, handler, ctx) {
            if ( ctx && typeof handler == 'string' ) {
                handler = ctx[handler];
            }
            $.subscribe(topic, function wrapper () {
                // we need to lose the idle first `event` argument
                var args = arraySlice.call(arguments, 1);
                return handler.apply(ctx || this, args);
            });
            return this;
        },
        unsubscribe     : function (topic, handler) {
            //TODO: this probably won't work since we're wrapping all handlers
            $.unsubscribe(topic, handler);
            return this;
        }
    });
}));