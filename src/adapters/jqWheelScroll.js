(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery.mousewheel', 'jqscroll'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * jquery-mousewheel + jqScroll adapter class for the Scrolled mixin.
     * Adds mousewheel support to jqScroll scrollers.
     * 
     * @class jqWheelScroll
     * @category Adapter
     * @extends module:Scrolled
     * @see {@link https://github.com/ydaniv/jqScroll#usage}
     */
    uijet.Adapter('jqWheelScroll', {
        /**
         * Initializes the jqScroll scroller.
         * 
         * #### Related options:
         * 
         * * `jqscroll_options`: config option for the `.scroller()` constructor.
         * * `horizontal`: if `true` then vertical scroller is disabled, as long as `grid_layout` option is off.
         * * `grid_layout`: if `true` then vertical scroller will _NOT_ be disabled disabled.
         * 
         * @memberOf jqWheelScroll
         * @instance
         * @returns {Widget} this
         */
        scroll  : function () {
            var that = this, el, is_horizontal,
                jqS_ops = this.options.jqscroll_options || {};

            if ( is_horizontal = (this.options.horizontal && ! this.options.grid_layout) ) {
                jqS_ops.horizontal = true;
                jqS_ops.vertical = false;
            }
            this._wrap().$wrapper.scroller(jqS_ops);
            el = this.$element[0];
            this.$element.unmousewheel().mousewheel(function (e, delta, dx, dy) {
                // prevent the default scrolling and keep it inside the widget
                e.preventDefault();
                //TODO: consider for optimization using cache based offset instead of using offsetLeft/Top which cause reflow
                that.scrollTo(is_horizontal ? (-el.offsetLeft - 37*dx) : (-el.offsetTop - 37*dy));
            });

            this.scroll_on = true;

            return this;
        },
        /**
         * Destroys the scroller instance.
         * 
         * @memberOf jqWheelScroll
         * @instance
         * @returns {Widget} this
         */
        unscroll: function () {
            this.$wrapper && this.$wrapper.scroller && this.$wrapper.scroller('destroy');
            this.scroll_on = false;
            return this;
        },
        /**
         * Scrolls to specified element or to a specified offset from the parent.
         * 
         * @memberOf jqWheelScroll
         * @instance
         * @param {HTMLElement|number} position - the element to scroll to or an offset in pixels to scroll to.
         * @returns {Widget} this
         */
        scrollTo: function (position) {
            this.$wrapper.scroller('scrollTo', position);
            return this;
        }
    });
}));
