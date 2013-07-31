(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/widgets/Button',
            'uijet_dir/mixins/Floated'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Widget('Dialog', {
        options : {
            type_class: ['uijet_pane', 'uijet_dialog']
        },
        register: function () {
            var buttons_configs,
                conf,
                buttons;
            this._super();
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
    }, ['Floated']);
}));
