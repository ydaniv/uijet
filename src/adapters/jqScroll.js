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
        setScrolling: function (switch_on) {
            var jqS_ops = {};
            if ( switch_on ) {
                if ( this.options.horizontal ) {
                    jqS_ops.horizontal = true;
                    jqS_ops.vertical = false;
                }
                this._wrap().$wrapper.scroller(jqS_ops);
            } else {
                this.$wrapper && this.$wrapper.scroller('destroy');
            }
            return this;
        },
        scrollTo    : function (position) {
            this.$wrapper.scroller('scrollTo', position);
            return this;
        }
    });
}));