(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Button',
            'uijet_dir/widgets/List'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(root.uijet);
    }
}(this, function (uijet) {

    /**
     * SelectMenu composite class.
     * Defines the `menu` part of the {@see Select} Composite.
     *
     * @class SelectMenu
     * @extends List
     * @category Composite
     */
    uijet.Widget('SelectMenu', {
        options     : {
            type_class: ['uijet_list', 'uijet_select_menu'],
            dont_wake : true,
            cloak     : true
        },
        /**
         * If supplied `toggle` argument is an object with a `resolve`
         * property it calls it with `this.$selected` as a value.
         *
         * @methodOf SelectMenu
         * @param {Object|boolean|HTMLElement|HTMLElement[]} [toggle] - a new item element
         * to set as the selected one, or `true` to toggle it if already cached. Can also
         * be an object with `toggle` and `resolve`, usually if invoked by the parent's {@see Select#select}.
         * In that case `toggle` will be the original `toggle` argument and `resolve` will be a resolver
         * for the selection promise.
         * @returns {SelectMenu}
         */
        setSelected : function (toggle) {
            var resolve;
            if ( toggle && toggle.resolve ) {
                resolve = toggle.resolve;
                toggle = toggle.toggle;
            }
            this._super(toggle);
            resolve && resolve(this.$selected);
            return this;
        }
    }, {
        widget : 'List'
    });

    /**
     * Select composite class.
     *
     * @class Select
     * @extends Button
     * @category Composite
     */
    uijet.Widget('Select', {
        options      : {
            type_class  : ['uijet_button', 'uijet_select']
        },
        /**
         * Constructs a {@see SelectMenu} instance.
         *
         * #### Related options:
         *
         * * `menu`: the SelectMenu declaration's config to be used for this instance.
         * * `menu_type`: the menu component's Widget type. Defaults to `'SelectMenu'`.
         * * `content`: an element or a selector for an element to be used as element
         * containing the selected item's content.
         *
         * @methodOf Select
         * @returns {Select}
         */
        initContained: function () {
            this._wrap();

            var has_element = this.options.menu && this.options.menu.element,
                menu_mixins = this.options.menu.mixins,
                $el = this.$wrapper,
                menu_app_events = {
                    //TODO: need to remove this and make it configurable in Toggled mixin
                    'app.clicked'   : function (event) {
                        var el = $el[0],
                            target = event.target;
                        if ( this.opened && el != target && ! uijet.utils.contains(el, target) ) {
                            this.sleep();
                        }
                    }
                },
                putMixin = uijet.utils.putMixin,
                menu_id = this.id + '_menu',
                $content = uijet.utils.toElement(this.options.content),
                menu_config;

            if ( ! $content ) {
                $content = uijet.$('<span>');
                this.$element[0].insertBefore($content[0], this.$element[0].firstElementChild);
            }
            // cache the content element
            this.$content = $content;

            // register the menu component to events
            menu_app_events[this.id + '.clicked'] = 'toggle';
            menu_app_events[this.id + '._set_selected'] = 'setSelected+';

            if ( ! has_element ) {
                has_element = uijet.$('<ul>', {
                    id  : menu_id
                });
                $el[0].appendChild(has_element[0]);
            }

            // move the menu declaration into list of components to be declared
            menu_config = uijet.utils.extend(true, {
                element   : has_element,
                mixins    : putMixin(putMixin(menu_mixins, 'Toggled'), 'Floated'),
                app_events: menu_app_events
            }, this.options.menu || {});

            this.options.components.unshift({
                type    : this.options.menu_type || 'SelectMenu',
                config  : menu_config
            });

            if ( ! menu_config.id ) {
                if ( typeof has_element == 'string' && has_element.indexOf('#') === 0 ) {
                    menu_config.id = has_element.slice(1);
                }
            }

            // subscribe the Select to selection event of the menu component
            this.subscribe((menu_config.id || menu_id) + '.selected', this.select);

            return this._super.apply(this, arguments);
        },
        /**
         * Updates the content element.
         *
         * @methodOf Select
         * @param {HTMLElement[]} $selected - the wrapped selected item.
         * @returns {Select}
         * @private
         */
        _setSelected : function ($selected) {
            if ( $selected && $selected.length ) {
                this.$content.text($selected.text());
            }
            return this;
        },
        /**
         * Triggers selection in the menu component and in turn
         * updates the text in the content element.
         *
         * @methodOf Select
         * @param {boolean|HTMLElement|HTMLElement[]} [toggle] - a new item element to set as the selected one, or `true` to toggle it if already cached.
         * @returns {Promise}
         */
        setSelected  : function (toggle) {
            return uijet.Promise(function (resolve) {
                this.publish('_set_selected', {
                        toggle : toggle,
                        resolve: resolve
                    });
            }.bind(this))
                .then(this._setSelected.bind(this));
        },
        /**
         * Performs selection of an item in the menu, according to
         * supplied `$selected` argument.
         *
         * #### Signals:
         *
         * * `pre_select`: triggered before selection is started. If `false` is returned
         * the selection will not be made. Gets passed the menu's selected wrapped item.
         * * `post_select`: triggered after selection is complete and rendered. If `false` is
         * returned the `<this.id>.selected` event of this instance will not be triggered.
         * Gets passed the menu's selected wrapped item.
         *
         * #### App Events:
         *
         * * `<this.id>.selected`: triggered
         *
         * @methodOf Select
         * @param {HTMLElement[]} $selected - the wrapped selected item.
         * @returns {Select}
         */
        select       : function ($selected) {
            if ( this.notify('pre_select', $selected) !== false ) {
                this.setSelected($selected).then(function () {
                    var publish = this.notify('post_select', $selected);
                    if ( publish !== false ) {
                        this.publish('selected', $selected);
                    }
                }.bind(this));
            }
            return this;
        }
    }, {
        widget: 'Button'
    });

}));
