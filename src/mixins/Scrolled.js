(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Scrolled', {
        scrolled            : true,
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
        // ### widget.scroll
        // @sign: scroll()  
        // @return: this
        //
        // Initializes the scrolling 3rd party lib or refreshes it.  
        // Implemented by the adapter.
        scroll              : function () {
            return this;
        },
        //TODO: add docs
        unscroll            : function () {
            return this;
        },
        //TODO: add docs
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
        // ### widget.scrollTo
        // @sign: scrollTo(position)  
        // @return: this
        //
        // Depending on the implementation of each scrolling lib it scrolls either to a fixed position or to an element,
        // using `position` either as a `Number` or an element.  
        // Implemented by the adapter.
        scrollTo            : function (position) {
            return this;
        },
        appear              : function () {
            // init/refresh the scroll
            this.scroll()
                // refresh wrapper size
                ._setWrapperSize()
                ._super();
            return this;
        },
        disappear           : function (no_transitions) {
            // destroy the scroll - iScroll, for instance, claims to take a lot of resources
            this.unscroll()
                // refresh wrapper size
                ._setWrapperSize(true)
                ._super(no_transitions);
            return this;
        },
        _clearRendered      : function () {
            // destroy the scroll
            this.has_content && this.unscroll();
            this._super();
            return this;
        },
        // ### widget._prepareScrolledSize
        // @sign: _prepareScrolledSize()  
        // @return: this
        //
        // Gets the size of the `$element`'s content, checks if it's bigger than its container's size
        // and if so set that size on `$element`.
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
        // ### widget._setWrapperSize
        // @sign: _setWrapperSize([clear])  
        // @return: this
        //
        // Makes sure the `$wrapper`'s height is not 0 (e.g. because of `overflow:hidden`) and if it is takes the
        // `$element`'s height and set it on the `$wrapper`.
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
