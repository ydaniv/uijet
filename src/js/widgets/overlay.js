uijet.Widget('Overlay', {
    options     : {
        type_class  : 'uijet_overlay'
    },
    init            : function (options) {
        this.setOptions(options)
            .setId()
            .setElement()
            ._setCloak(true)
            .prepareElement()
            .setInitOptions()
            .register()
            ._saveOriginal()
            .render(); // that's the difference
        this.notify('post_init');
        return this;
    },
    appear      : function () {
        this.$wrapper.addClass('uijet_top_overlay');
        this._setCloak(false);
        return this;
    },
    disappear   : function () {
        this.$wrapper.removeClass('uijet_top_overlay');
        this._setCloak(true);
        return this;
    }
});