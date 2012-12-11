// ### AMD wrapper
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
        // ### widget.setScrolling
        // @sign: setScrolling([switch_on])  
        // @return: this
        //
        // Initializes the scrolling 3rd party lib or refreshes it, if called with `switch_on`=`true`.  
        // If it's falsy then it attempts to destroy the scrolling lib's instance.  
        // Implemented by the adapter.
        setScrolling        : function (switch_on) {
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
            this.setScrolling(true)
                // refresh wrapper size
                ._setWrapperSize()
                ._super();
            return this;
        },
        disappear           : function (no_transitions) {
            // destroy the scroll - iScroll, for instance, claims to take a lot of resources
            this.setScrolling(false)
                // refresh wrapper size
                ._setWrapperSize(true)
                ._super(no_transitions);
            return this;
        },
        _clearRendered      : function () {
            // destroy the scroll
            this.has_content && this.setScrolling(false);
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
                } else {
                    // get the `$wrapper`'s height
                    _h = this.$wrapper[0].offsetHeight;
                    // if it's 0 for some reason
                    if ( ! _h ) {
                        this.height_dirty = true;
                        // take the `$element`'s height and set it explicitly on the `$wrapper`
                        this.$wrapper[0].style.height = this.$element[0].offsetHeight + 'px';
                    }
                }
            }
            return this;
        }
    });
}));