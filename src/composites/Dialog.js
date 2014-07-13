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
    uijet.Widget('Dialog', {
        options: {
            type_class: ['uijet_pane', 'uijet_dialog']
        }
    }, ['Floated']);
}));
