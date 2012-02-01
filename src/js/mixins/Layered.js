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
        setCurrent  : function () {
            uijet.switchCurrent(this);
            return this;
        }
    });
}));