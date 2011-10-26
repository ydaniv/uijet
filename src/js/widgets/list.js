uijet.Widget('List', {
    options             : {
        type_class  : 'uijet_list',
        signals     : {
            post_render : function () {
                this.options.horizontal && this._prepareHorizontal();
            }
        }
    },
    destroy             : function () {
        this.setScrolling(false);
        this._clearRendered();
        return this;
    },
    prepareElement      : function () {
        var class_attr = 'uijet_widget ' + this.options.type_class;
        class_attr += this.options.horizontal ? ' horizontal' : '';
        this.$element.addClass(class_attr);
        this.setSize();
        return this;
    },
    setScrolling        : function (switch_on) {
        return this;
    },
    _setCloak           : function (cloak) {
        this.setScrolling(!cloak)
            .$element[0].style.visibility = cloak ? 'hidden' : 'visible';
        return this;
    },
    _prepareHorizontal  : function () {
        var _size = this._getSize();
        this.$element[0].style.width = _size.width + 'px';
        return this;
    },
    _getSize            : function () {
        var children = this.$element.children(),
            total_width = 0,
            l = children.length,
            size = { width: 0, height: 0 },
            child, rect;
        while ( child = children[--l] ) {
            rect = child.getClientRects();
            total_width += (rect && rect[0] && rect[0].width) || 0;
        }
        size.width = total_width;
        size.height = (rect && rect[0].height) || 0;
        return size;
    }
}, 'Templated');