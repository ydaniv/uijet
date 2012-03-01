// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
                'uijet_dir/uijet',
                'uijet_dir/widgets/Base'
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
                _horizontal = this.options.horizontal,
                _align;
            // if `align` option is set
            if ( _horizontal ) {
                this.$element.addClass('horizontal');
                delete this.options.horizontal;
            }
            if ( _align = this.options.align ) {
                // set it as a `class` on `$element` prefixed by 'align_'
                this.$element.addClass('align_' + _align);
            }
            // delegate all clicks from `item_element` option as selecot or `li`  
            //TODO: switch to $element.on('click', 'li  ', function ...)  
            //TODO: runRoute or publish on select  should be called implicitly or by coniguration and not explicitly
            this.$element.delegate(item_element || 'li', 'click', function (e) {
                // get the selected element  
                // if `item_element` option is set get the closest `li` stating from current element  
                // if not then use current element
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
        },
        bind            : function () {
            var initial = this.options.initial;
            this._super();
            // if `initial` option is set the perform selection inside the widget
            if ( initial ) {
                this.select(initial);
            }
            return this;
        }
    });
}));