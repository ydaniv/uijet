(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    /**
     * Pane widget class.
     * 
     * This is the most basic form of component.
     * It's basically a semantic wrapper on top of {@link BaseWidget}.
     * 
     * @class Pane
     * @category Widget
     * @extends BaseWidget
     */
    uijet.Widget('Pane', {
        options : {
            type_class  : 'uijet_pane'
        }
    });
}));
