(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'jquery',
            'uijet_dir/modules/pubsub/_handlers-cache',
            'ba-tinypubsub'
        ], function (uijet, $, handlers_cache) {
            return factory(root, uijet, $, handlers_cache);
        });
    } else {
        factory(root, root.uijet, root.jQuery, root.uijet_handlers_cache);
    }
}(this, function (root, uijet, $, handlers_cache) {
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
            var wrapper = function () {
                // we need to lose the idle first `event` argument
                var args = arraySlice.call(arguments, 1);
                // make sure the handler is executed in a later task on the queue
                uijet.utils.async(function () { handler.apply(ctx || this, args); });
            };
            handlers_cache.put(handler, wrapper, topic);
            $.subscribe(topic, wrapper);
            return this;
        },
        unsubscribe     : function (topic, handler) {
            var wrapper = handlers_cache.pop(topic, handler);
            $.unsubscribe(topic, wrapper);
            return this;
        }
    });
}));
