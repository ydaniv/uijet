(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
                'uijet_dir/uijet',
                'uijet_dir/widgets/Base',
                'uijet_dir/mixins/Templated',
                'uijet_dir/mixins/Scrolled'
            ], function (uijet) {
                return factory(uijet);
            });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Widget('List', {
        options             : {
            type_class  : 'uijet_list'
        },
        prepareElement  : function () {
            var that = this,
                item_element = this.options.item_element,
                _align;
            if ( _align = this.options.align ) {
                this.$element.addClass('align_' + _align);
            }
            //TODO: switch to $element.on('click', 'li  ', function ...)
            this.$element.delegate(item_element || 'li', 'click', function (e) {
                uijet.is_iPad && e.preventDefault();
                // get the selected element
                var $this = item_element ? $(this).closest('li') : $(this),
                // notify the `post-select` signal
                    _continue = that.notify(true, 'post_select', $this, e);
                // if `post_select signal` is handled and returns specifically `false` then prevent it
                if( _continue !== false ) {
                    // make sure this element still exists inside the DOM
                    if ( $this && $this.length && $this.parent().length ) {
                        // cache selection
                        that.$selected = $this;
                        // paint selection
                        $this.siblings()
                            .removeClass('selected');
                        $this.addClass('selected');
                    }
                }
            });
            this._super();
            return this;
        }
    }, ['Templated', 'Scrolled']);
}));