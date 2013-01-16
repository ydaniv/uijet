// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'eventbox'], function (uijet, Ebox) {
            return factory(uijet, Ebox);
        });
    } else {
        factory(uijet, root.Eventbox);
    }
}(this, function (uijet, Ebox) {
    uijet.use({
        publish     : function (topic, data) {
            Ebox.notify(topic, data);
            return this;
        },
        subscribe   : function (topic, handler, context) {
            if ( context && typeof handler == 'string' ) {
                handler = context[handler];
            }
            Ebox.listen(topic, handler);
            return this;
        },
        unsubscribe : function (topic, handler) {
            Ebox.unlisten(topic, handler);
            return this;
        }
    }, uijet);

    return Ebox;
}));