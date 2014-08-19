(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/widgets/Overlay',
            'uijet_dir/widgets/Button'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Modal dialog composite class.
     *
     * @class Modal
     * @extends BaseWidget
     * @category Composite
     */
    uijet.Widget('Modal', {
        options : {
            type_class: ['uijet_pane', 'uijet_modal'],
            position  : 'center'
        },
        /**
         * Creates an {@see Overlay} instance for the underlay.
         * Also translates the `buttons` option into a part of the `components` option.
         *
         * #### Related options:
         *
         * * `underlay`: config object for the Overlay used as the modal's underlay.
         * * `buttons`: array of config objects for Button components to create.
         *
         * @methodOf Modal
         * @returns {Modal}
         */
        initContained: function () {
            var buttons = this.options.buttons,
                components = this.options.components,
                overlay, overlay_id;

            // since this is a modal dialog,
            // create the overlay element
            overlay = document.createElement('div');
            overlay_id = this.id + '_underlay';
            overlay.id = overlay_id;
            // append this as content element of the overlay
            overlay.appendChild((this.$wrapper || this.$element)[0]);
            // insert the overlay to the app's element's as its first child
            uijet.$element[0].insertBefore(overlay, uijet.$element[0].firstChild);

            // create the overlay widget
            components.unshift({ type: 'Overlay', config: uijet.utils.extend(true, {
                element     : overlay,
                id          : overlay_id,
                container   : this.id,
                darken: true,
                cloak : true
            }, this.options.underlay || {}) });

            if ( buttons ) {
                buttons = buttons.map(function (config) {
                    return {
                        type  : 'Button',
                        config: config
                    };
                });

                components.unshift.apply(components, buttons);
            }

            return this._super.apply(this, arguments);
        }
    });
}));
