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
                // `item_selector` option allows the widget to be markup agnostic.  
                // If it's set it will be used as the top item element - defaults to `li`
                item_selector = this.options.item_selector || 'li',
                // `item_element` option can be used to set an element inside `element_selector`
                // which behaves like the item itself
                item_element = this.options.item_element,
                _horizontal = this.options.horizontal,
                class_attrs = [],
                click_event = this.options.click_event,
                _align;
            // if `horizontal` option is set
            if ( _horizontal ) {
                // add the 'horizontal' 
                class_attrs.push('horizontal');
            }
            // if `align` option is set
            if ( _align = this.options.align ) {
                // set it as a `class` on `$element` prefixed by 'align_'
                class_attrs.push('align_' + _align);
            }
            if ( class_attrs.length ) {
                this.$element.addClass(class_attrs.join(' '));
            }
            // delegate all clicks from `item_element` option as selector or `item_selector`  
            this.$element.on(click_event || uijet.support.click_events.full, item_element || item_selector, function (e) {
                // get the selected element  
                // if `item_element` option is set get the closest `item_selector` stating from current element  
                // if not then use current element
                var $this = item_element ? uijet.$(this).closest(item_selector) : uijet.$(this),
                    // allow user to bail from selection
                    _continue = that.notify('pre_select', $this, e);
                // if `pre_select signal` is handled and returns specifically `false` then prevent it
                if( _continue !== false ) {
                    // make sure this element still exists inside the DOM
                    if ( $this && $this.length && $this.parent().length ) {
                        that.publish('selected', $this)
                        // cache & paint selection
                            .setSelected($this);
                    }
                    that.notify('post_select', $this, e);
                }
            });
            this._super();
            return this;
        },
        bindAll         : function () {
            var initial = this.options.initial;
            this._super();
            // if `initial` option is set the perform selection inside the widget
            if ( initial ) {
                this.select(initial);
            }
            return this;
        },
        // ### widget.setSelected([item])
        //
        // @sign: setSelected(jQuery_object)
        // @sign: setSelected(element)
        // @sign: setSelected(boolean)
        // @sign: setSelected()
        // @return: this
        //
        // Sets the class of the element currently set in `this.$selected` to `selected` and removes it from
        // any previously selected items.  
        // If called with a jQuery object or an HTMLElement object it will set `this.$selected` to that element and then
        // set the class as above.  
        // If called with a boolean it will toggle the `selected` class on the currently `this.$selected` element. `true`
        // will add the class and `false` will remove it.  
        // No arguments will be treated like `false`.
        setSelected     : function (toggle) {
            var $old = this.$selected;
            if ( toggle && toggle[0] && toggle[0].nodeType ) {
                this.$selected = toggle;
                toggle = true;
            } else if ( toggle && toggle.nodeType === 1) {
                this.$selected = uijet.$(toggle);
                toggle = true;
            } else {
                toggle = !!toggle;
            }
            if ( this.$selected && this.$selected.parent().length ) {
                if ( toggle ) {
                    $old && $old.removeClass('selected');
                }
                this.$selected.toggleClass('selected', toggle);
            }
            return this;
        },
        _clearRendered  : function () {
            delete this.$selected;
            this._super();
            return this;
        }
    });
}));