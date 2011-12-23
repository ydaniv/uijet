uijet.Widget('List', {
    options             : {
        type_class  : 'uijet_list'
    },
    prepareElement  : function () {
        var that = this, _align;
        if ( _align = this.options.align ) {
            this.$element.addClass('align_' + _align);
        }
        //TODO: switch to $element.on('click', 'a', function ...)
        this.$element.delegate('a', 'click', function (e) {
            uijet.is_iPad && e.preventDefault();
            var $this = $(this).closest('li');
            if ( $this && $this.length && $this.parent().length ) {
                $this.siblings()
                     .removeClass('selected');
                $this.addClass('selected');
            }
            that.notify('post_select', $this, e);
        });
        this._super();
        return this;
    }
}, ['Templated', 'Scrolled']);
