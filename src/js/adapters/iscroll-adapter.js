uijet.Adapter('iScroll', {
    setScrolling        : function (switch_on) {
        var iS_ops = {};
        if ( switch_on ) {
            this._wrap();
            if ( this.options.horizontal ) {
                iS_ops.vScroll = false;
                iS_ops.vScrollbar = false;
            }
            this.iScroll = new iScroll(this.$wrapper[0], iS_ops);
        } else {
            this.iScroll && this.iScroll.destroy();
        }
        return this;
    }
});