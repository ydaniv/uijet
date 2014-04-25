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

    uijet.use({
        publish    : function (topic, data) {
            pubsub.publish(topic, data);

            return this;
        },
        subscribe  : function (topic, handler, context) {
            if ( context && typeof handler == 'string' ) {
                handler = context[handler];
            }

            _storeTokenAndHandler(pubsub.subscribe(topic, handler));

            return this;
        },
        unsubscribe: function (topic, handler) {
            var tokens = _extractTokenList(topic, handler);

            for ( var n = 0; n < tokens.length; n++ )
                pubsub.unsubscribe(tokens[n]);

            return this;
        }
    }, uijet);

    return pubsub;
}));
