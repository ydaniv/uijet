(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'iscroll'], function (uijet, iScroll) {
            return factory(uijet, iScroll || root.IScroll);
        });
    } else {
        factory(uijet, root.IScroll);
    }
}(this, function (uijet, iScroll) {

    /**
     * iScroll adapter class for the Scrolled mixin.
     * 
     * @class iScroll
     * * @category Adapter
     * @extends module:Scrolled
     * @see {@link http://iscrolljs.com/}
     */
    uijet.Adapter('iScroll', {
        /**
         * Initializes the iScroll scroller.
         * If called and the scroller already exists it's `refresh()`ed.
         * 
         * #### Related options:
         * 
         * * `iscroll_options`: config object to use with the `iScroll` constructor.
         * * `horizontal`: if `true` and `grid_layout` option is off then vertical scroller is disabled.
         * * `grid_layout`: if `true` the vertical scroller will not be disabled.
         * 
         * @see {@link http://iscrolljs.com/#configuring}
         * @memberOf iScroll
         * @instance
         * @returns {Widget} this
         */
        scroll: function () {
            var iS_ops = {
                bounce  : false
            };
            if ( this.iScroll ) {
                this.iScroll.refresh();
            }
            else {
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
        /**
         * Destroys the scroller.
         * 
         * @see {@link http://iscrolljs.com/#destroy}
         * @memberOf iScroll
         * @instance
         * @returns {Widget} this
         */
        unscroll: function () {
            this.iScroll && this.iScroll.destroy();
            this.iScroll = null;
            this.scroll_on = false;
            return this;
        },
        /**
         * Scrolls to specified element, a fixed location, or by a specified offset.
         * If an `object` is used for `element` then it has to contain the following:
         * 
         * * `x`: the horizontal offset to scroll to in pixels, or offset to move to if `by` is `true`.
         * * `y`: the vertical offset to scroll to in pixels, or offset to move to if `by` is `true`.
         * * `[by]`: if `true` then iScroll's `scrollBy()` will be used instead of `scrollTo()`. 
         * 
         * @see {@link http://iscrolljs.com/#indicators}
         * @memberOf iScroll
         * @instance
         * @param {HTMLElement|Object} element - the element to scroll to or an `object` containing the offsets.
         * @param {number} [time] - duration of the scroll in milliseconds.
         * @param {string} [easing] - a name of an easing function supported by iScroll.
         * @returns {Widget} this
         */
        scrollTo: function (element, time, easing) {
            if ( easing && iScroll.utils.ease[easing] ) {
                easing = iScroll.utils.ease[easing];
            }
            if ( this.iScroll ) {
                if ( uijet.utils.isObj(element) ) {
                    this.iScroll[element.by ? 'scrollBy' : 'scrollTo'](element.x, element.y, time, easing);
                }
                else {
                    //TODO: implement support for offsetX and offsetY
                    this.iScroll.scrollToElement(uijet.utils.toElement(element)[0], time, 0, 0, easing);
                }
            }
            return this;
        }
    });
}));
