(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jqscroll'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Adapter('jqScroll', {
        scroll  : function () {
            var jqS_ops = this.options.jqscroll_options || {};
            if ( this.options.horizontal ) {
                jqS_ops.horizontal = true;
                jqS_ops.vertical = false;
            }
            this._wrap().$wrapper.scroller(jqS_ops);
            this.scroll_on = true;
            return this;
        },
        unscroll: function () {
            this.$wrapper && this.$wrapper.scroller && this.$wrapper.scroller('destroy');
            this.scroll_on = false;
            return this;
        },
        scrollTo: function (position) {
            this.$wrapper.scroller('scrollTo', position);
            return this;
        }
    });
}));
