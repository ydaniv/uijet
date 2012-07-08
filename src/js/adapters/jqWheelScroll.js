(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'plugins/jquery.mousewheel', 'plugins/jqscroll'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Adapter('jqWheelScroll', {
        setScrolling: function (switch_on) {
            var that = this,
                jqS_ops = {};
            if ( switch_on ) {
                if ( this.options.horizontal ) {
                    jqS_ops.horizontal = true;
                    jqS_ops.vertical = false;
                }
                that._wrap().$wrapper.scroller(jqS_ops);
                that.$element.mousewheel(function (e, delta, dx, dy) {
                    var pos = that.$element.position();
                    that.scrollTo(that.horizontal ? (-pos.left - 37*dx) : (-pos.top - 37*dy));
                });

            } else {
                that.$wrapper && this.$wrapper.scroller('destroy');
            }
            return this;
        },
        scrollTo    : function (position) {
            this.$wrapper.scroller('scrollTo', position);
            return this;
        }
    });
}));