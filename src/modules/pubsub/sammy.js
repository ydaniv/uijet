(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/modules/pubsub/_handlers-cache',
            'sammy'
        ], function (uijet, handlers_cache) {
            return factory(root, uijet, handlers_cache);
        });
    } else {
        root.uijet.pubusb = factory(root, root.uijet, root.uijet_handlers_cache);
    }
}(this, function (root, uijet, handlers_cache) {
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
                var wrapper = function () {
                    // we need to lose the idle first `event` argument
                    var args = arraySlice.call(arguments, 1);
                    // make sure the handler is executed in a later task on the queue
                    uijet.utils.async(function () { handler.apply(context || this, args); });
                };
                handlers_cache.put(handler, wrapper, topic);
                app.bind(topic, wrapper);
                return this;
            },
            unsubscribe     : function (topic, handler) {
                var wrapper = handlers_cache.pop(topic, handler);
                app._unlisten(topic, wrapper);
                return this;
            }
        });
    };
}));
