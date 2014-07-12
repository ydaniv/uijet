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

    /**
     * Form widget class.
     * 
     * @class Form
     * @category Widget
     * @extends BaseWidget
     * @mixes Submitted
     */
    uijet.Widget('Form', {
        /**
         * @member {Object} Form#options
         */
        options         : {
            type_class  : 'uijet_form',
            /**
             * Default form serializer.
             * Returns an `Object` that maps `name`s of children
             * elements to their `value`s.
             * `disabled` inputs and `checkbox` and `radio` inputs that are not checked are ignored.
             * If a `name` appears more then once, e.g. `radio` elements, then
             * the corresponding value on the returned serialized object will be an
             * `Array` of the values, ordered according to the elements' order in 
             * the document.
             * 
             * @function Form#options.serializer
             * @param {Object} [extra_data] - extra data to add to the serialized result.
             * @param {boolean} [as_defaults] - if `true` then `extra_data` object will be used as defaults and not override form data.
             * @returns {Object} - serialized form data.
             */
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
                        if ( ! uijet.utils.isArr(data[name]) ) {
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
                if ( uijet.utils.isObj(extra_data) ) {
                    args = [extra_data];
                    args[as_defaults ? 'push' : 'unshift'](data);
                    uijet.utils.extend.apply(uijet.utils, args);
                }
                return data;
            },
            /**
             * @member {Object} Form#options.dom_events
             */
            dom_events  : {
                /**
                 * Delegates `change` event from value changes of child field elements
                 * to an app event publishing.
                 * 
                 * #### Related options:
                 * 
                 * * `change_exclude`: list of `name`s, or a function that returns it, of fields to exclude from `change` event delegation. 
                 * 
                 * #### App Events:
                 * 
                 * * `<this.id>_<name>.changed`: published when the field with name `name` fires `change` event.
                 * Takes `Object` with `event` obejct and `value`.
                 * 
                 * @member {function} Form#options.dom_events.change
                 * @param {Object} e - `change` event object.
                 */
                change  : function (e) {
                    var target = e.target,
                        // name is the `name` attribute and falls back to `id`
                        name = target.name || target.id,
                        // the published value either the `value` property or `false` if it's a checkbox and not checked
                        value = boolean_type_re.test(target.type) && ! target.checked ? false : uijet.$(target).val(),
                        excluded = uijet.utils.returnOf(this.options.change_exclude, this);
                    // if there aren't any excluded fields or this field is not in the excluded list then publish the changed event
                    (!excluded || !~ excluded.indexOf(name)) &&
                        uijet.publish(this.id + '_' + name + '.changed', {
                            event   : e,
                            value   : value
                        });
                }
            }
        },
        /**
         * Binds {@link Form#submit} to the `submit` event of the instance's
         * element, unless the `submit_handled` option of `uijet` is set to
         * `true`.
         * 
         * @memberOf Form
         * @instance
         * @returns {Form}
         */
        register        : function () {
            this._super();
            // check if there's no one else handling the form submit event, e.g. Sammy.js
            if ( ! uijet.options.submit_handled ) {
                this.bind('submit', function (e) {
                    // stop and prevent it
                    e.preventDefault();
                    e.stopPropagation();
                    // instead call `submit`
                    this.submit();
                }.bind(this));
            }
            return this;
        },
        /**
         * Triggers `focus` event on the first input, ones the instance
         * appears, unless `dont_focus` option is set to `true`.
         * 
         * #### Related options:
         * 
         * * `dont_focus`: tells the instance not to focus its first input on appearing.
         * 
         * @memberOf Form
         * @instance
         * @returns {Form}
         */
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
        /**
         * Finds all child elements that match the `error_selector` option,
         * or `.error` as default, and empties them.
         * 
         * #### Related options:
         * 
         * * `error_selector`: query selector for finding elements containing error messages and emptying them.
         * 
         * @memberOf Form
         * @instance
         * @returns {Form}
         */
        clearErrors     : function () {
            (this.$wrapper || this.$element).find(this.options.error_selector || '.error').empty();
            return this;
        }
    }, ['Submitted']);
}));
