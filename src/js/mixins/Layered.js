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
        layered         : true,
        prepareElement  : function () {
            this._super();
            // since this relies on CSS this mixin must be included in the right order in relation to other mixins
            // to make sure that the proper element is used below and, for example. that `setCurrent` is called in
            // the right order with `transit`.
            (this.$wrapper || this.$element).addClass('layered');
            return this;
        },
        sleep           : function () {
            this._super();
            (this.$wrapper || this.$element).removeClass('current');
            return this;
        },
        appear          : function () {
            this.setCurrent()
                ._super();
            return this;
        },
        // ### widget.setCurrent
        // @sign: setCurrent()  
        // @return: this
        //
        // Hooks to `uijet.switchCurrent` to make sure this widget is the top layer among its sibling widgets.
        setCurrent      : function () {
            uijet.switchCurrent(this);
            return this;
        }
    });
}));