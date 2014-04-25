(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'eventbox'], function (uijet, Ebox) {
            return factory(uijet, Ebox);
        });
    } else {
        factory(uijet, root.Eventbox);
    }
}(this, function (uijet, Ebox) {
    /**
     * Eventbox pubsub module.
     * 
     * @module pubsub/eventbox
     * @extends uijet
     * @see {@link https://github.com/ydaniv/eventbox#eventboxjs}
     * @exports Eventbox
     */
    uijet.use({
        /**
         * Publish an event.
         * 
         * @method module:pubsub/eventbox#publish
         * @see {@link https://github.com/ydaniv/eventbox#how-to-use}
         * @param {string} topic - type of event to publish.
         * @param {*} [data] - data to send to the registered handlers.
         * @returns {uijet}
         */
        publish     : function (topic, data) {
            Ebox.notify(topic, data);
            return this;
        },
        /**
         * Subscribes a handler to an event of type `topic`.
         * 
         * @method module:pubsub/eventbox#subscribe
         * @see {@link https://github.com/ydaniv/eventbox#how-to-use}
         * @param {string} topic - the event type to register the handler to.
         * @param {function} handler - function to trigger when `topic` event is published.
         * @returns {uijet}
         */
        subscribe   : function (topic, handler) {
            Ebox.listen(topic, handler);
            return this;
        },
        /**
         * Unsubscribe a handler from a topic, or all handlers of a topic.
         * 
         * If handler is not supplied all handlers of type `topic` will be removed.
         * 
         * @method module:pubsub/eventbox#unsubscribe
         * @see {@link https://github.com/ydaniv/eventbox#how-to-use}
         * @param {string} topic - topic to unsubscribe from.
         * @param {*} [handler] - identifier of the handler to remove, e.g: the handler function itself.
         * @returns {uijet}
         */
        unsubscribe : function (topic, handler) {
            Ebox.unlisten(topic, handler);
            return this;
        }
    }, uijet);

    return Ebox;
}));
