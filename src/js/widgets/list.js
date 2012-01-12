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
            var $this = $(this).closest('li'),
                _continue = that.notify(true, 'post_select', $this, e);
            // if post_select signal is handled and returns specificaly false then prevent it
            if( _continue === false ) {
                e.preventDefault();
            }
            // make sure this element still exists inside the DOM
            else if ( $this && $this.length && $this.parent().length ) {
                // cache selection
                that.$selected = $this;
                // paint selection
                $this.siblings()
                    .removeClass('selected');
                $this.addClass('selected');
            }
        });
        this._super();
        return this;
    }
}, ['Templated', 'Scrolled']);