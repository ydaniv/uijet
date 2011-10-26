uijet.Widget('Overlay', {
    options     : {
        type_class  : 'uijet_overlay',
        signals     : {
            post_init   : function () {
                this.render();
            }
        }
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