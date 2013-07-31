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
    uijet.Widget('Modal', {
        options : {
            type_class: ['uijet_pane', 'uijet_modal'],
            position  : 'center'
        },
        register: function () {
            var overlay,
                overlay_id,
                buttons_configs,
                conf,
                buttons;
            this._super();
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
            uijet.start({ type: 'Overlay', config: uijet.utils.extend(true, {
                element     : overlay,
                id          : overlay_id,
                container   : this.id,
                darken      : true
            }, this.options.underlay_options || {}) }, true);
            // if we have buttons to create
            if ( buttons_configs = uijet.utils.toArray(this.options.buttons) ) {
                buttons = [];
                while ( conf = buttons_configs.shift() ) {
                    conf.container || (conf.container = this.id);
                    buttons.push({
                        type    : 'Button',
                        config  : conf
                    });
                }
                uijet.start(buttons);
            }
            return this;
        }
    });
}));
