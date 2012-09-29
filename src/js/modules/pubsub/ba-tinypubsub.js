// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery', 'ba-tinypubsub'], function (uijet, $) {
            return factory(uijet, $);
        });
    } else {
        factory(uijet, root.jQuery);
    }
}(this, function (uijet, $) {
    uijet.use({
        publish         : function (topic, data) {
            $.publish(topic, data);
            return this;
        },
        subscribe       : function (topic, handler, ctx) {
            if ( ctx ) {
                if ( typeof handler == 'string' ) {
                    handler = ctx[handler];
                }
                handler = handler.bind(ctx);
            }
            $.subscribe(topic, handler);
            return this;
        },
        unsubscribe     : function (topic, handler) {
            $.unsubscribe(topic, handler);
            return this;
        }
    });
}));