(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jqscroll'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * jqScroll adapter class for the Scrolled mixin.
     * 
     * @class jqScroll
     * @category Adapter
     * @extends module:Scrolled
     * @see {@link https://github.com/ydaniv/jqScroll#usage}
     */
    uijet.Adapter('jqScroll', {
        /**
         * Initializes the jqScroll scroller.
         * 
         * #### Related options:
         * 
         * * `jqscroll_options`: config option for the `.scroller()` constructor.
         * * `horizontal`: if `true` then vertical scroller is disabled, as long as `grid_layout` option is off.
         * * `grid_layout`: if `true` then vertical scroller will _NOT_ be disabled disabled.
         * 
         * @memberOf jqScroll
         * @instance
         * @returns {Widget} this
         */
        scroll  : function () {
            var jqS_ops = this.options.jqscroll_options || {};
            if ( this.options.horizontal && ! this.options.grid_layout ) {
                jqS_ops.horizontal = true;
                jqS_ops.vertical = false;
            }
            this._wrap().$wrapper.scroller(jqS_ops);
            this.scroll_on = true;
            return this;
        },
        /**
         * Destroys the scroller instance.
         * 
         * @memberOf jqScroll
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
         * @memberOf jqScroll
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
