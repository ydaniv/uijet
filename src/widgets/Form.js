// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/mixins/Submitted'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    var boolean_type_re = /checkbox|radio/i;

    uijet.Widget('Form', {
        options         : {
            type_class  : 'uijet_form',
            serializer  : function (extra_data, as_defaults) {
                var $fields = this.$element.find('[name]'),
                    data = {}, args;
                $fields.each(function (i, field) {
                    if ( field.disabled ) return;
                    var name = field.name;
                    // if it's a checkbox or a radio field and not checked then ignore
                    if ( boolean_type_re.test(field.type) && ! field.checked ) return;
                    // if this key already exists
                    if ( name in data ) {
                        // if it's corresponding value is not an `Array`
                        if ( ! uijet.Utils.isArr(data[name]) ) {
                            // wrap it in an `Array`
                            data[name] = [data[name]];
                        }
                        // push the new value to the list
                        data[name].push(field.value);
                    }
                    else {
                        // otherwise just set this value
                        data[name] = field.value;
                    }
                });
                if ( uijet.Utils.isObj(extra_data) ) {
                    args = [extra_data];
                    args[as_defaults ? 'push' : 'unshift'](data);
                    uijet.Utils.extend.apply(uijet.Utils, args);
                }
                return data;
            },
            dom_events  : {
                change  : function (e) {
                    var target = e.target,
                    // name is the `name` attribute and falls back to `id`
                        name = target.name || target.id,
                    // the published value either the `value` property or `false` if it's a checkbox and not checked
                        value = boolean_type_re.test(target.type) && ! target.checked ? false : uijet.$(target).val(),
                        excluded = uijet.Utils.returnOf(this.options.changed_exclude, this);
                    // if there aren't any excluded fields or this field is not in the excluded list then publish the changed event
                    (!excluded || !~ excluded.indexOf(name)) && uijet.publish(this.id + '_' + name + '.changed', value);
                }
            }
        },
        register        : function () {
            var that = this;
            this._super();
            // check if there's no one else handling the form submit event, e.g. Sammy.js
            if ( ! uijet.options.submit_handled ) {
                this.$element.on('submit', function (e) {
                    // stop and prevent it
                    e.preventDefault();
                    e.stopPropagation();
                    // instead call `submit`
                    that.submit();
                });
            }
            return this;
        },
        appear          : function () {
            var $inputs;
            this._super();
            // on iOS devices the element.focus() method is broken  
            // if `dont_focus` option is not set to `true`
            if ( ! this.options.dont_focus ) {
                // find first `<input>` and focus on it
                $inputs = this.$element.find('input');
                $inputs.length && $inputs.get(0).focus();
            }
            return this;
        },
        // ### widget.getSubmitRoute
        // @sign: getSubmitRoute()  
        // @return: submit_route OR `null`
        //
        // Returns an `Object` with __method__ and __path__ keys which represent a RESTful route, which
        // is the route that's called when the form is submitted.  
        // Checks the `submit_route` option, if it's an `Object` then use its path value, or if it's a `String`
        // then use it as __path__.  
        // If this option isn't set check for the `actoin` attribute of `$element`.  
        // If that isn't set too then return `null`.  
        // if this option isn`t set, check for the method value or check the `method` attribute on `$element`, or
        // simply use 'get'.
        getSubmitRoute  : function () {
            var route = this.options.submit_route,
                path = route ? route.path || route : this.$element.attr('action');
            return path ? { method: route && route.method || this.$element.attr('method') || 'get', path: path } : null;
        },
        // ### widget.clearErrors
        // @sign: clearErrors()
        // @return: this
        //
        // Clears error messages in the DOM.
        clearErrors     : function () {
            // looks for elements with `error` `class` and empties them.
            this.$element.find('.error').empty();
            return this;
        }
    }, ['Submitted']);
}));