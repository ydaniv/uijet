// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
                'uijet_dir/uijet',
                'uijet_dir/widgets/Base',
                'uijet_dir/mixins/Layered',
                'uijet_dir/mixins/Templated'
            ],
            function (uijet) {
                return factory(uijet);
            }
        );
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Widget('ContentPane', {
        options : {
            type_class  : 'uijet_content_pane'
        }
    }, ['Layered', 'Templated']);
}));