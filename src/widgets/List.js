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

    /**
     * List widget class.
     * 
     * @class List
     * @category Widget
     * @extends BaseWidget
     */
    uijet.Widget('List', {
        options             : {
            type_class  : 'uijet_list'
        },
        /**
         * If `initial` options is set calls {@link List#click} event on it.
         * 
         * #### Related options:
         * 
         * * `initial`: 
         * 
         * @memberOf List
         * @instance
         * @returns {List}
         */
        init            : function () {
            var res = this._super.apply(this, arguments),
                initial = this.options.initial;
            // if `initial` option is set the perform selection inside the widget
            if ( initial ) {
                this.select(initial);
            }
            return res;
        },
        /**
         * Adds list related classes to `this.$element` and binds
         * {@link List#click} to a selection event on it.
         * 
         * #### Related options:
         * 
         * * `item_selector`: a query selector that states an item in the list. Defaults to `'li'`.
         * * `click_target`: a query selector to delegate the selection event form.
         * * `horizontal`: if `true` adds the `horizontal` class to `this.$element`.
         * * `click_event`: space separated event types to use for binding the {@link List#click}.
         * * `align`: adds an extra class to `this.$element` prefixed by `'align_'`, for controlling items alignment. 
         * 
         * @memberOf List
         * @instance
         * @returns {List}
         */
        prepareElement  : function () {
            var that = this,
                _horizontal = this.options.horizontal,
                class_attrs = [],
                click_event = this.options.click_event,
                _align;
            // `item_selector` option allows the widget to be markup agnostic.  
            // If it's set it will be used as the top item element - defaults to `li`
            this._item_selector = this.options.item_selector || 'li';
            // `click_target` option can be used to set an element inside `item_selector`
            // which will be used to delegate clicks from to the containing element that
            // matches `item_selector`
            this._click_target = this.options.click_target;
            // if `horizontal` option is set
            if ( _horizontal ) {
                // add the 'horizontal' class
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

            //TODO: research what's the best option is to have both: events delegated to parent and handler is passed target item as first argument
            // delegate all clicks from `item_element` option as selector or `item_selector`  
            this.$element.on(
                    click_event || uijet.support.click_events.full,
                    this._click_target || this._item_selector,
                function (e) {
                    // pass the target and event object as arguments
                    return that.click(this, e);
                });

            this._super();
            return this;
        },
        /**
         * Wraps {@see List#click} and triggers item selection using
         * the `target` argument.
         *
         * @memberOf List
         * @instance
         * @param {string} target - selector for the item to select.
         * @returns {List}
         */
        select          : function (target) {
            this.click(uijet.utils.toElement(target, this.$element));
            return this;
        },
        /**
         * Handler for items selection event.
         * 
         * #### Signals:
         * 
         * * `pre_select`: triggered in the beginning. Takes the wrapped selected item and event object as arguments.
         *     * If it returns `false` the `<this.id>.selected` event and `post_select` signals will not be triggered.
         *     * If it returns any other defined value, that value will be used as the data argument passed to the `<this.id>.selected` event handler.
         * * `post_select`: triggered at the end. Takes the wrapped selected item and event object as arguments.
         * 
         * #### App Events:
         * 
         * * `<this.id>.selected`: takes the result of {@link List#getTransfer} or
         * 
         * @memberOf List
         * @instance
         * @param {HTMLElement} el - the target element of the selection event.
         * @param {Object} event - the selection event object.
         */
        click           : function (el, event) {
            // get the selected element  
            // if `item_element` option is set get the closest `item_selector` starting from current element  
            // if not then use current element
            var $selected = this._click_target ? uijet.$(el).closest(this._item_selector) : uijet.$(el),
                // allow user to set the selected event's data or bail from selection
                transfer = this.notify('pre_select', $selected, event);
            // if `pre_select signal` is handled and returns specifically `false` then prevent it
            if( transfer !== false ) {
                // make sure this element still exists inside the DOM
                if ( $selected && $selected.length && $selected[0].ownerDocument.body.contains($selected[0]) ) {
                    this.publish('selected', transfer === void 0 ? this.getTransfer($selected) : transfer)
                    // cache & paint selection
                        .setSelected($selected);
                }
                this.notify('post_select', $selected, event);
            }
        },
        /**
         * Sets and caches the selected item, marking it with the
         * `selected` class, while removing it from the last selected
         * item.
         * 
         * This only takes care of the instance's state, without performing
         * other side effects.
         * 
         * @memberOf List
         * @instance
         * @param {boolean|HTMLElement|HTMLElement[]} [toggle] - a new item element to set as the selected one, or `true` to toggle it if already cached. 
         * @returns {List}
         */
        setSelected     : function (toggle) {
            var $old = this.$selected;

            if ( toggle && toggle[0] && toggle[0].nodeType ) {
                this.$selected = toggle;
                toggle = true;
            }
            else if ( toggle && toggle.nodeType === 1 ) {
                //TODO: check if uijet.$() can be replaced here with this.$element.find().
                this.$selected = uijet.$(toggle);
                toggle = true;
            }
            else {
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
        /**
         * Stub for transforming the data that is sent with the
         * `<this.id>.selected` event.
         * By default returns the wrapped selected item element.
         * 
         * @memberOf List
         * @instance
         * @param $selected
         * @returns {List}
         */
        getTransfer     : function ($selected) {
            return $selected;
        },
        /**
         * Deletes reference to `this.$selected`.
         * 
         * @memberOf List
         * @instance
         * @returns {List}
         * @private
         */
        _clearRendered  : function () {
            delete this.$selected;
            this._super();
            return this;
        }
    });
}));
