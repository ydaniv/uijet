(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(function () {
            return factory();
        });
    } else {
        root.uijet_handlers_cache = factory();
    }
}(this, function () {

    return {
        handlers        : [],
        wrappers        : [],
        _push           : function (handler, wrapper, topic) {
            if ( typeof handler == 'function' ) {
                var wrapper_box = {};
                this.handlers.push(handler);
                wrapper_box[topic] = wrapper;
                wrapper_box.length = 1;
                this.wrappers.push(wrapper_box);
            }
            else {
                this.wrappers[handler][topic] = wrapper;
                this.wrappers[handler].length++;
            }
        },
        push            : function (handler, wrapper, topic) {
            var index = this.handlers.indexOf(handler);
            this._push(
                ~ index ? index : handler,
                wrapper,
                topic
            );
        },
        _pop            : function (index) {
            this.wrappers.splice(index, 1);
            this.handlers.splice(index, 1);
        },
        _removeWrapper  : function (box, topic) {
            delete box[topic];
            return --box.length;
        },
        pop             : function (topic, handler) {
            var remove_indices = [-1], // the -1 will break the while loop
                wrapper, index;
            if ( handler ) {
                index = this.handlers.indexOf(handler);
                if ( ~ index ) {
                    if ( wrapper = this.wrappers[index][topic] ) {
                        if ( ! this._removeWrapper(this.wrappers[index], topic) ) {
                            this._pop(index);
                        }
                        return wrapper;
                    }
                }
            }
            else {
                // remove all wrappers for given topic
                this.wrappers.forEach(function (box, n) {
                    if ( box[topic] ) {
                        if ( ! this._removeWrapper(box, topic) ) {
                            remove_indices.push(n);
                        }
                    }
                });
                while ( ~ (index = remove_indices.pop()) ) {
                    this._pop(index);
                }
            }
        }
    };
}));
