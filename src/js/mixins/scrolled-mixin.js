uijet.Mixin('Scrolled', {
    scrolled            : true,
    prepareElement      : function () {
        this.options.horizontal && this.$element.addClass('horizontal');
        this._super();
        return this;
    },
    setScrolling        : function (switch_on) {
        return this;
    },
    scrollTo            : function (position) {
        return this;
    },
    appear              : function () {
        this.setScrolling(true)
            ._setWrapperSize()
            ._super();
        return this;
    },
    disappear           : function (no_transitions) {
        this.setScrolling(false)
            ._setWrapperSize(true)
            ._super(no_transitions);
        return this;
    },
    _clearRendered      : function () {
        this.has_content && this.setScrolling(false);
        this._super();
        return this;
    },
    _prepareScrolledSize: function () {
        var _size = this._getSize(), el = this.$element[0];
        if ( this.options.horizontal ) {
            if ( el.offsetWidth < _size.width ) {
                this.$element[0].style.width = _size.width + 'px';
            }
        } else {
            if ( el.offsetHeight < _size.height ) {
                this.$element[0].style.height = _size.height + 'px';
            }
        }
        return this;
    },
    _setWrapperSize     : function (clear) {
        var _h;
        if ( this.$wrapper ) {
            if ( clear && this.height_dirty ) {
                this.$wrapper[0].setAttribute('style', '');
                this.$wrapper[0].removeAttribute('style');
                delete this.height_dirty;
            } else {
                _h = this.$wrapper && this.$wrapper[0].offsetHeight;
                if ( ! _h ) {
                    this.height_dirty = true;
                    this.$wrapper[0].style.height = this.$element[0].offsetHeight + 'px';
                }
            }
        }
        return this;
    }
});
