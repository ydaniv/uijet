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

    uijet.Widget('Checkbox', {
        options         : {
            type_class  : ['uijet_button', 'uijet_checkbox']
        },
        //TODO: add docs
        check           : function (state) {
            this.checked = typeof state == 'boolean' ? state : ! this.checked;
            this.$checkbox[0].checked = this.checked;
            this.$element.toggleClass('checked', this.checked);
            return this;
        },
        //TODO: add docs
        disable         : function (state) {
            this.disabled = typeof state == 'boolean' ? state : ! this.disabled;
            this.$checkbox[0].disabled = this.disabled;
            this.$element.toggleClass('disabled', this.disabled);
            return this;
        },
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
        click           : function (e) {
            var _publish = this.notify('pre_click', e, this.checked);
            if ( _publish !== false ) {
                this.check()
                    .publish('clicked', {
                        context : this.context,
                        checked : this.checked,
                        event   : e
                    });
                uijet.publish('app.clicked', e);
            }
            if ( e.target === this.$element[0] && e.eventPhase === 2 ) {
                e.preventDefault();
            }
            e.stopPropagation();
            return this;
        }
    }, {
        widgets : ['Button']
    });
}));
