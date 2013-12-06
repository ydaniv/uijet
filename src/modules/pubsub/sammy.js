(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'sammy'
        ], function (uijet) {
            return factory(root, uijet);
        });
    } else {
        root.uijet.pubusb = factory(root, uijet);
    }
}(this, function (root, uijet) {
    return function (app) {
        // cache reference to Array's slice method
        var arraySlice = root.Array.prototype.slice,
        handlers_cache = {
            handlers: [],
            wrappers: [],
            push    : function (handler, wrapper, topic) {
                var index = this.handlers.indexOf(handler),
                    wrapper_box;
                if ( ~ index ) {
                    this.wrappers[index][topic] = wrapper;
                    this.wrappers[index].length++;
                }
                else {
                    this.handlers.push(handler);
                    wrapper_box = {};
                    wrapper_box[topic] = wrapper;
                    wrapper_box.length = 1;
                    this.wrappers.push(wrapper_box);
                }
            },
            pop     : function (topic, handler) {
                var remove_indices = [],
                    wrapper, index;
                if ( handler ) {
                    index = this.handlers.indexOf(handler);
                    if ( ~ index ) {
                        if ( wrapper = this.wrappers[index][topic] ) {
                            delete this.wrappers[index][topic];
                            this.wrappers[index].length--;
                            if ( ! this.wrappers[index].length ) {
                                this.wrappers.splice(index, 1);
                                this.handlers.splice(index, 1);
                            }
                            return wrapper;
                        }
                    }
                }
                else {
                    this.wrappers.forEach(function (box, n) {
                        if ( box[topic] ) {
                            delete box[topic];
                            box.length--;
                            if ( ! box.length ) {
                                remove_indices.push(n);
                            }
                        }
                    });
                    while ( index = remove_indices.pop(), typeof index == 'number' ) {
                        this.wrappers.splice(index, 1);
                        this.handlers.splice(index, 1);
                    }
                }
            }
        };

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
