(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'plugins/iscroll'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Adapter('iScroll', {
        setScrolling: function (switch_on) {
            var iS_ops = {
                bounce  : false
            };
            if ( switch_on ) {
                if ( this.iScroll ) {
                    this.iScroll.refresh();
                } else {
                    this._wrap();
                    if ( this.options.horizontal && ! this.options.grid_layout ) {
                        iS_ops.vScroll = false;
                        iS_ops.vScrollbar = false;
                    }
                    this.iScroll = new iScroll(this.$wrapper[0], uijet.Utils.extend(iS_ops, this.options.iscroll_options || {}));
                }
            } else {
                this.iScroll && this.iScroll.destroy();
                delete this.iScroll;
            }
            return this;
        },
        scrollTo    : function (element, time) {
            this.iScroll && this.iScroll.scrollToElement(element.jquery ? element[0] : element, time);
        }
    });
}));