// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Layered', {
        appear      : function () {
            this.setCurrent()
                ._super();
            return this;
        },
        // ### widget.setCurrent
        // @sign: setCurrent()  
        // @return: this
        //
        // Hooks to `uijet.switchCurrent` to make sure this widget is the top layer among its sibling widgets.
        setCurrent  : function () {
            uijet.switchCurrent(this);
            return this;
        }
    });
}));