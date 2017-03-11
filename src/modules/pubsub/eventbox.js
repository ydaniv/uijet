(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['eventbox'], function (ebox) {
            return factory(ebox);
        });
    } else {
        factory(root.Eventbox);
    }
}(this, function (ebox) {
    /**
     * Eventbox pubsub module.
     * 
     * @module pubsub/eventbox
     * @category Module
     * @sub-category Pub/Sub
     * @extends uijet
     * @see {@link https://github.com/ydaniv/eventbox#eventboxjs}
     */
    return function (uijet) {
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
            publish    : function (topic, data) {
                ebox.notify(topic, data);
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
            subscribe  : function (topic, handler) {
                ebox.listen(topic, handler);
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
            unsubscribe: function (topic, handler) {
                ebox.unlisten(topic, handler);
                return this;
            }
        }, uijet);

        uijet.eventbox = ebox;
    };
}));
