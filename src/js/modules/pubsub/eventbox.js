// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'eventbox'], function (uijet, Ebox) {
            return factory(uijet, Ebox);
        });
    } else {
        root.uijet_pubusb = factory(uijet, Eventbox);
    }
}(this, function (uijet, Ebox) {
    return function (context) {
        uijet.use({
            publish         : function (topic, data) {
                Ebox.notify(topic, data);
                return this;
            },
            subscribe       : function (topic, handler, context) {
                if ( context ) {
                    if ( typeof handler == 'string' ) {
                        handler = context[handler];
                    }
                    Ebox.bind(context);
                }
                Ebox.listen(topic, handler);
                return this;
            },
            unsubscribe     : function (topic, handler) {
                Ebox.unlisten(topic, handler);
                return this;
            }
        }, uijet, context);

        return Ebox;
    };
}));