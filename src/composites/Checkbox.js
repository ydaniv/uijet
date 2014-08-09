(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Button'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Checkbox composite class.
     *
     * @class Checkbox
     * @extends Button
     * @category Composite
     */
    uijet.Widget('Checkbox', {
        options         : {
            type_class  : ['uijet_button', 'uijet_checkbox']
        },
        /**
         * Creates the shadow DOM checkbox `<input>` element.
         *
         * #### Related options:
         *
         * * `checkbox`: configuration object for setting up the `<input>` element.
         *   * `checked`: if `true` the `<input>` will be initialized as checked.
         *   * `disabled`: if `true` the `<input>` will be initialized as disabled.
         *   * `value`: sets the initial `<input>`'s value.
         *   * `name`: sets the `<input>`'s `name` attribute for serialization.
         *   * `attributes`: an object for setting all other attirbutes of the `<input>` element.
         *
         * @methodOf Checkbox
         * @returns {Checkbox}
         */
        prepareElement  : function () {
            var ops = this.options.checkbox || {},
                input_config = uijet.utils.extend({
                    type    : 'checkbox',
                    tabindex: -1,
                    name    : ops.name,
                    value   : 'value' in ops ? ops.value : 'on',
                    'class' : 'hide'
                }, ops.attributes || {}),
                checked = ops.checked,
                disabled = ops.disabled;

            this._super();

            checked && (input_config.checked = true);
            disabled && (input_config.disabled = true);
            this.$checkbox = uijet.$('<input>', input_config).appendTo(this.$element);

            checked && this.check(true);
            disabled && this.disable(true);

            return this;
        },
        /**
         * Sets the instance's checked property and also the `<input>`'s
         * `checked` property to the given `state` argument if it's a boolean.
         * Otherwise toggles it.
         *
         * @methodOf Checkbox
         * @param {boolean} [state] - the new checked state to set.
         * @returns {Checkbox}
         */
        check           : function (state) {
            this.checked = typeof state == 'boolean' ? state : ! this.checked;
            this.$checkbox[0].checked = this.checked;
            this.$element.toggleClass('checked', this.checked);
            return this;
        },
        /**
         * Sets the instance's disabled property and also the `<input>`'s
         * `disabled` property to the given `state` argument if it's a boolean.
         * Otherwise toggles it.
         *
         * @methodOf Checkbox
         * @param {boolean} [state] - the new disabled state to set.
         * @returns {Checkbox}
         */
        disable         : function (state) {
            this.disabled = typeof state == 'boolean' ? state : ! this.disabled;
            this.$checkbox[0].disabled = this.disabled;
            this.$element.toggleClass('disabled', this.disabled);
            return this;
        },
        /**
         * Toggles the `checked` state of the instance and propagates the click
         * event.
         *
         * #### Signals:
         *
         * * `pre_click`: triggered at the beginning, passing the click event object and the current
         * `checked` state as arguments. If `false` is returned the call to {@see Checkbox.check}
         * and events publishing are skipped.
         *
         * #### App events:
         *
         * * `<this.id>.clicked`: passes its context under `context`, its new `checked` state and the
         * `event` object in the data argument.
         * * `app.clicked`: notifies the rest of the app that a click occurred, passing the click
         * event object as argument.
         *
         * @methodOf Checkbox
         * @param {Object} event - the click event object.
         * @returns {Checkbox}
         */
        click           : function (event) {
            var _publish = this.notify('pre_click', event, this.checked);
            if ( _publish !== false ) {
                this.check()
                    .publish('clicked', {
                        context : this.getContext(),
                        checked : this.checked,
                        event: event
                    });
                uijet.publish('app.clicked', event);
            }
            if ( event.target === this.$element[0] && event.eventPhase === 2 ) {
                event.preventDefault();
            }
            event.stopPropagation();
            return this;
        }
    }, {
        widgets : ['Button']
    });
}));
