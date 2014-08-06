(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/mixins/Floated'
        ], function (uijet) {
            return factory(uijet);
        });
    }
    else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Dialog composite class.
     *
     * @class Dialog
     * @extends BaseWidget
     * @category Composite
     */
    uijet.Widget('Dialog', {
        options      : {
            type_class: ['uijet_pane', 'uijet_dialog']
        },
        /**
         * Translate the `buttons` option into a part of the `components` option.
         *
         * #### Related options:
         *
         * * `buttons`: array of config objects for Button components to create.
         *
         * @methodOf Dialog
         * @returns {Dialog}
         */
        initContained: function () {
            var components, buttons;

            if ( buttons = this.options.buttons ) {
                buttons = buttons.map(function (config) {
                    return {
                        type  : 'Button',
                        config: config
                    };
                });

                if ( !(components = this.options.components) ) {
                    this.options.components = components = [];
                }

                components.unshift.apply(components, buttons);
            }

            return this._super.apply(this, arguments);
        }
    }, ['Floated']);
}));
