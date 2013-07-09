(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'iscroll'], function (uijet, iScroll) {
            return factory(uijet, iScroll || root.iScroll);
        });
    } else {
        factory(uijet, root.iScroll);
    }
}(this, function (uijet, iScroll) {
    uijet.Adapter('iScroll', {
        scroll: function () {
            var iS_ops = {
                bounce  : false
            };
            if ( this.iScroll ) {
                this.iScroll.refresh();
            } else {
                this._wrap();
                if ( this.options.horizontal && ! this.options.grid_layout ) {
                    iS_ops.vScroll = false;
                    iS_ops.vScrollbar = false;
                }
                this.iScroll = new iScroll(this.$wrapper[0], uijet.utils.extend(iS_ops, this.options.iscroll_options || {}));
            }
            this.scroll_on = true;
            return this;
        },
        unscroll: function () {
            this.iScroll && this.iScroll.destroy();
            delete this.iScroll;
            this.scroll_on = false;
            return this;
        },
        scrollTo: function (element, time) {
            this.iScroll && this.iScroll.scrollToElement(element.jquery ? element[0] : element, time);
            return this;
        }
    });
}));
