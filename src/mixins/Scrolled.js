(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(root, uijet);
        });
    } else {
        factory(root, uijet);
    }
}(this, function (root, uijet) {

    /**
     * Scrolled mixin class.
     * 
     * @mixin Scrolled
     * @category Mixin
     * @extends BaseWidget
     */
    uijet.Mixin('Scrolled', {
        scrolled            : true,
        /**
         * Prepares the element to be scrolled in a wrapping
         * container.
         * 
         * #### Related options:
         * 
         * * `horizontal`: if `true` then the `horizontal` class is added to the element.
         * 
         * @memberOf Scrolled
         * @instance
         * @returns {Scrolled}
         */
        prepareElement      : function () {
            this._super()
                ._wrap()
                .$wrapper.addClass('scrolled');
            // set the `horizontal` class if that option is set
            this.options.horizontal && this.$element.addClass('horizontal');
            if ( ! this.templated ) {
                this._prepareScrolledSize();
            }
            return this;
        },
        /**
         * Initializes the scroller or refreshes it.
         * A stub noop to be implemented by a scrolling library adapter.
         * 
         * @memberOf Scrolled
         * @instance
         * @returns {Scrolled}
         */
        scroll              : function () {
            this.scroll_on = true;
            return this;
        },
        /**
         * Destroys the scroller.
         * A stub noop to be implemented by a scrolling library adapter.
         * 
         * @memberOf Scrolled
         * @instance
         * @returns {Scrolled}
         */
        unscroll            : function () {
            this.scroll_on = false;
            return this;
        },
        /**
         * Toggles scroller on and off, initializing or destroying it.
         * If `switch_on` is provided then if it's `true` {@link Scrolled#scroll}
         * is invoked, if `false` then {@link Scrolled#unscroll}.
         * If `switch_on` is omitted then the state is simply toggled.
         * 
         * @memberOf Scrolled
         * @instance
         * @param {boolean} [switch_on] - forces toggle to initialize or destroy.
         * @returns {Scrolled}
         */
        scrollToggle        : function (switch_on) {
            typeof switch_on == 'boolean' ?
                switch_on ?
                    this.scroll() :
                    this.unscroll() :
                this.scroll_on ?
                    this.unscroll() :
                    this.scroll();
            return this;
        },
        /**
         * Scrolls the element in its container.
         * To be implemented by the scrolling library adapter.
         * 
         * @memberOf Scrolled
         * @instance
         * @param {*} [position] - any parameter that can determine the position to scroll to, depending on implementation of scrolling library.
         * @returns {*}
         */
        scrollTo            : function (position) {
            return this;
        },
        /**
         * Initializes scrolling and ensures the container
         * element wraps the element properly.
         * 
         * @memberOf Scrolled
         * @instance
         * @returns {Scrolled}
         */
        //TODO: support working async with promises
        appear              : function () {
            // init/refresh the scroll
            this.scroll()
                // refresh wrapper size
                ._setWrapperSize()
                ._super();
            return this;
        },
        /**
         * Destroys the scroller and resets the
         * container's size.
         * 
         * @memberOf Scrolled
         * @instance
         * @param {boolean} [no_transitions] - supplied to the `_super()` call.
         * @returns {Scrolled}
         */
        //TODO: support working async with promises
        disappear           : function (no_transitions) {
            // destroy the scroll - iScroll, for instance, claims to take a lot of resources
            this.unscroll()
                // refresh wrapper size
                ._setWrapperSize(true)
                ._super(no_transitions);
            return this;
        },
        /**
         * Gets the size of a widget's element, taking its child elements into account.
         *
         * #### Related options:
         *
         * * `horizontal`: controls size calculation - height of a single child element and width of all children
         * when `true`, or vise versa if falsy.
         *
         * @memberOf Scrolled
         * @instance
         * @returns {{width: number, height: number}}
         * @private
         */
        _getSize        : function () {
            var $children = this.$element.children(),
                last_child = $children[$children.length - 1],
                size = { width: 0, height: 0 },
                // since the default overflow of content is downward just get the last child's position + height
                total_height = last_child && (last_child.offsetTop + last_child.offsetHeight) || 0,
                total_width = 0;
            if ( this.options.horizontal ) {
                // since HTML is finite horizontally we *have* to count all children
                $children.each(function (i, child) {
                    // get the computed style object
                    var style = root.getComputedStyle(child, null);
                    // add the total width of each child + left & right margin
                    total_width += child.offsetWidth + (+style.marginLeft.slice(0, -2)) +
                                   (+style.marginRight.slice(0, -2));
                });
                size.width = total_width;
                // height is by default the total height of the first child
                $children.length && (size.height = $children[0].offsetHeight);
            }
            else {
                // it's a vertical widget
                // width is by default the total width of the first child
                $children.length && (size.width = $children[0].offsetWidth);
                size.height = total_height;
            }
            return size;
        },
        /**
         * Ensures `this.$element` wraps around its content.
         * 
         * #### Related options:
         * 
         * * `horizontal`: if `true` makes sure that the element's width stretches to the width of its content.
         * * `grid_layout`: disables the above stretching.
         * 
         * @memberOf Scrolled
         * @instance
         * @returns {Scrolled}
         * @private
         */
        _prepareScrolledSize: function () {
            // get the size of the content
            var _size = this._getSize(), el = this.$element[0];
            //TODO: need to support a scroll on both dimensions  
            // make the `$element`'s size as big as its content if it's smaller
            if ( this.options.horizontal && ! this.options.grid_layout ) {
                if ( el.offsetWidth < _size.width ) {
                    this.$element[0].style.width = _size.width + 'px';
                }
            }
            return this;
        },
        /**
         * Ensures `this.$wrapper` wraps around `this.$element`.
         * 
         * @memberOf Scrolled
         * @instance
         * @param {boolean} [clear] - if `true` then the dirty styles set on `this.$wrapper` are cleared.
         * @returns {Scrolled}
         * @private
         */
        _setWrapperSize     : function (clear) {
            var _h;
            if ( this.$wrapper && ! this.options.horizontal ) {
                // if `clear` is truthy and height was tempered with
                if ( clear && this.height_dirty ) {
                    // clear style.height
                    this.$wrapper[0].style.height = '';
                    delete this.height_dirty;
                }
                // if the `$wrapper` has no visible height
                else if ( ! this.$wrapper[0].offsetHeight ) {
                    // fallback to `$element`'s height
                    _h = this.$element[0].offsetHeight;
                    if ( _h ) {
                        // if there's an actual value set it as the height of the wrapper
                        this.height_dirty = true;
                        this.$wrapper[0].style.height = _h + 'px';
                    }
                }
            }
            return this;
        }
    });
}));
