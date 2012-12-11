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
            var that = this, el, is_horizontal,
                jqS_ops = {};
            if ( switch_on ) {
                if ( is_horizontal = (this.options.horizontal  && ! this.options.grid_layout) ) {
                    jqS_ops.horizontal = true;
                    jqS_ops.vertical = false;
                }
                this._wrap().$wrapper.scroller(jqS_ops);
                el = this.$element[0];
                this.$element.unmousewheel().mousewheel(function (e, delta, dx, dy) {
                    // prevent the default scrolling and keep it inside the widget
                    e.preventDefault();
                    that.scrollTo(is_horizontal ? (-el.offsetLeft - 37*dx) : (-el.offsetTop - 37*dy));
                });

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