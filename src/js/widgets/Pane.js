// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/mixins/Layered'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Widget('Pane', {
        options : {
            type_class  : 'uijet_pane'
        }
    }, ['Layered']);
}));