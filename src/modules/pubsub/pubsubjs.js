(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'pubsubjs'], function (uijet, pubsub) {
            return factory(uijet, pubsub);
        });
    }
    else {
        factory(uijet, root.PubSub);
    }
}(this, function (uijet, pubsub) {

    var tokens_map = {};

    function _storeTokenAndHandler (topic, token, handler) {
        if ( !(topic in tokens_map) ) {
            tokens_map[topic] = [];
        }
        tokens_map[topic].push({ token: token, handler: handler });
    }

    function _extractTokenList (topic, handler) {
        var identifiers = [],
            ids = tokens_map[topic],
            id;
        if ( ids ) {
            if ( handler ) {
                for ( var i = 0; id = ids[i]; i++ ) {
                    if ( handler === id.handler ) {
                        identifiers.push(id.token);
                        ids.splice(i, 1);
                        break;
                    }
                }
            }
            else {
                identifiers = ids.map(function (id) {
                    return id.token;
                });
                delete tokens_map[topic];
            }
        }
        return identifiers;
    }

    /**
     * PubSubJS pubsub module.
     * 
     * @module pubsub/pubsubjs
     * @category Module
     * @sub-category Pub/Sub
     * @extends uijet
     * @see {@link https://github.com/mroderick/PubSubJS#pubsubjs}
     * @exports PubSub
     */
    uijet.use({
        /**
         * Publish an event.
         * 
         * @method module:pubsub/pubsubjs#publish
         * @see {@link https://github.com/mroderick/PubSubJS#basic-example}
         * @param {string} topic - type of event to publish.
         * @param {*} [data] - data to send to the registered handlers.
         * @returns {uijet}
         */
        publish    : function (topic, data) {
            pubsub.publish(topic, data);

            return this;
        },
        /**
         * Subscribes a handler to an event of type `topic`.
         * 
         * @method module:pubsub/pubsubjs#subscribe
         * @see {@link https://github.com/mroderick/PubSubJS#basic-example}
         * @param {string} topic - type of event to publish.
         * @param {*} [data] - data to send to the registered handlers.
         * @returns {uijet}
         */
        subscribe  : function (topic, handler, context) {
            if ( context && typeof handler == 'string' ) {
                handler = context[handler];
            }

            _storeTokenAndHandler(pubsub.subscribe(topic, handler));

            return this;
        },
        /**
         * Unsubscribe a handler from a topic, or all handlers of a topic.
         * 
         * If handler is not supplied all handlers of type `topic` will be removed.
         * 
         * @method module:pubsub/pubsubjs#unsubscribe
         * @see {@link https://github.com/mroderick/PubSubJS#cancel-specific-subscripiton}
         * @param {string} topic - type of event to publish.
         * @param {*} [data] - data to send to the registered handlers.
         * @returns {uijet}
         */
        unsubscribe: function (topic, handler) {
            var tokens = _extractTokenList(topic, handler);

            for ( var n = 0; n < tokens.length; n++ )
                pubsub.unsubscribe(tokens[n]);

            return this;
        }
    }, uijet);

    return pubsub;
}));
