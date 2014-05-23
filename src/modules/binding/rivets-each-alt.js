(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'rivets'
        ], function (rivets) {
            return factory(rivets);
        });
    }
    else {
        factory(root.rivets);
    }
}(this, function (rivets) {

    /*
     * Adopted and compiled from: 
     */
    rivets.binders['each-*'].routine = function (el, collection) {
        var binding, buffer, buffers, data, element, element_list, index, iter, iter_index, iter_model, iterated_mirror, k, key, last_buffer, model, modelName, options, previous, template, v, view, view_model, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _results;
        modelName = this.args[0];
        collection = collection || [];
        iterated_mirror = (function () {
            var _i, _len, _ref, _results;
            _ref = this.iterated;
            _results = [];
            for ( _i = 0, _len = _ref.length; _i < _len; _i++ ) {
                iter = _ref[_i];
                _results.push(iter.models[modelName]);
            }
            return _results;
        }).call(this);
        element_list = [];
        for ( index = _i = 0, _len = collection.length; _i < _len; index = ++_i ) {
            model = collection[index];
            iter_model = iterated_mirror[index];
            if ( model === iter_model ) {
                continue;
            }
            iter_index = iterated_mirror.indexOf(model);
            if ( ~iter_index ) {
                if ( !~collection.indexOf(iter_model) ) {
                    view = this.iterated.splice(index, 1)[0];
                    view.unbind();
                    this.marker.parentNode.removeChild(view.els[0]);
                    iterated_mirror.splice(index, 1);
                    if ( index < iter_index ) {
                        iter_index -= 1;
                    }
                }
                if ( iter_index !== index && iterated_mirror[iter_index] ) {
                    view = this.iterated.splice(iter_index, 1)[0];
                    this.iterated.splice(index, 0, view);
                    element_list.push({
                        el : this.marker.parentNode.removeChild(view.els[0]),
                        idx: index
                    });
                    iterated_mirror.splice(index, 0, iterated_mirror.splice(iter_index, 1)[0]);
                }
            }
            else {
                data = {};
                data[modelName] = model;
                _ref = this.view.models;
                for ( key in _ref ) {
                    view_model = _ref[key];
                    if ( data[key] == null ) {
                        data[key] = view_model;
                    }
                }
                options = {
                    binders   : this.view.options.binders,
                    formatters: this.view.options.formatters,
                    adapters  : this.view.options.adapters,
                    config    : {}
                };
                _ref1 = this.view.options.config;
                for ( k in _ref1 ) {
                    v = _ref1[k];
                    options.config[k] = v;
                }
                options.config.preloadData = true;
                template = el.cloneNode(true);
                view = new rivets._.View(template, data, options);
                view.bind();
                this.iterated.splice(index, 0, view);
                iterated_mirror.splice(index, 0, model);
                element_list.push({
                    el : template,
                    idx: index
                });
            }
        }
        while ( this.iterated.length > collection.length ) {
            view = this.iterated.pop();
            view.unbind();
            this.marker.parentNode.removeChild(view.els[0]);
        }
        if ( element_list.length ) {
            element_list.sort(function (a, b) {
                if ( a.idx < b.idx ) {
                    return -1;
                }
                else {
                    return 1;
                }
            });
            buffers = [];
            last_buffer = null;
            for ( _j = 0, _len1 = element_list.length; _j < _len1; _j++ ) {
                element = element_list[_j];
                if ( !buffers.length ) {
                    last_buffer = new ElementBuffer(element.el, element.idx);
                    buffers.push(last_buffer);
                }
                else {
                    if ( !last_buffer.add(element.el, element.idx) ) {
                        last_buffer = new ElementBuffer(element.el, element.idx);
                        buffers.push(last_buffer);
                    }
                }
            }
            for ( _k = 0, _len2 = buffers.length; _k < _len2; _k++ ) {
                buffer = buffers[_k];
                index = buffer.first_index;
                previous = index && this.iterated[index - 1] ? this.iterated[index - 1].els[0] : this.marker;
                this.marker.parentNode.insertBefore(buffer.fragment, previous.nextSibling);
            }
        }
        if ( el.nodeName === 'OPTION' ) {
            _ref2 = this.view.bindings;
            _results = [];
            for ( _l = 0, _len3 = _ref2.length; _l < _len3; _l++ ) {
                binding = _ref2[_l];
                if ( binding.el === this.marker.parentNode && binding.type === 'value' ) {
                    _results.push(binding.sync());
                }
                else {
                    _results.push(void 0);
                }
            }
            return _results;
        }
    };

    function ElementBuffer (element, last_index) {
        this.last_index = last_index;
        this.fragment = element;
        this.first_index = this.last_index;
        this.length = 1;
    }

    ElementBuffer.prototype.add = function (element, index) {
        if ( index === this.first_index - 1 ) {
            this.insert(element, true);
            this.first_index = index;
            return true;
        }
        else if ( index === this.last_index + 1 ) {
            this.insert(element);
            this.last_index = index;
            return true;
        }
        else {
            return false;
        }
    };

    ElementBuffer.prototype.insert = function (element, preppend) {
        var fragment;
        if ( !this.wrapped ) {
            fragment = document.createDocumentFragment();
            fragment.appendChild(this.fragment);
            this.fragment = fragment;
            this.wrapped = true;
        }
        if ( preppend ) {
            this.fragment.insertBefore(element, this.fragment.firstChild);
        }
        else {
            this.fragment.appendChild(element);
        }
        return this.length += 1;
    };

    return ElementBuffer;


}));
