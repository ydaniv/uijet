(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/widgets/Button',
            'uijet_dir/widgets/List',
            'uijet_dir/mixins/Floated',
            'uijet_dir/mixins/Toggled'
        ], function (uijet) {
            return factory(uijet);
        });
    }
    else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Dropmenu Button composite class.
     *
     * @class DropmenuButton
     * @extends Button
     * @category Composite
     */
    uijet.Widget('DropmenuButton', {
        options      : {
            type_class: ['uijet_button', 'uijet_dropmenubutton'],
            dont_wrap : false
        },
        /**
         * Initializes menu component, and arrow button component if set.
         *
         * #### Related options:
         *
         * * `menu`: the menu component's config.
         * * `arrow`: the arrow Button component's config.
         * Can also be set to `true` and the default arrow button component will be created.
         * * `dont_close`: when `true` keeps the menu open on selection. Otherwise its `close()` method is invoked.
         *
         * @methodOf DropmenuButton
         * @returns {DropmenuButton}
         */
        initContained: function () {
            this._wrap();

            var id = this.id,
                drop_menu_id = id + '_menu',
                options = this.options,
                components = options.components,
                drop_arrow_id, drop_arrow_config,
            // configure the dropdown menu
                drop_menu_config = uijet.utils.extend(true, {
                    id            : drop_menu_id,
                    container     : id,
                    dont_wake     : true,
                    sync          : true,
                    extra_class   : 'uijet_menu',
                    float_position: function () {
                        var wrapper = this._wrap().$wrapper[0],
                            parent = wrapper.offsetParent || wrapper.parentNode;
                        while ( parent && parent.nodeType !== 1 ) {
                            parent = parent.parentNode;
                        }
                        return 'top: ' + (parent ? parent.offsetHeight : 0) + 'px;';
                    },
                    signals       : {
                        pre_select: function ($selected, e) {
                            e.stopPropagation();
                            if ( ! this.options.dont_close ) {
                                this.sleep();
                            }
                        },
                        pre_sleep : function () {
                            this.opened = false;
                        }
                    },
                    app_events    : {
                        // in order to stay as less obtrusive as possible sleep when this global event is triggered
                        'app.clicked': function (event) {
                            var target_id = event.target.id;
                            if ( this.opened && ! ~ target_id.indexOf(id) ) {
                                this.sleep();
                            }
                        }
                    }
                }, options.menu || {}),
                drop_menu_events = drop_menu_config.app_events,
                clicked_handler = 'toggle+',

                add_arrow = ! ! options.arrow,
                drop_menu, drop_arrow;

            // if we need a separate arrow button configure it
            if ( add_arrow ) {
                drop_arrow_id = id + '_drop_arrow';

                // configure the arrow button
                drop_arrow_config = uijet.utils.extend(true, {
                    id         : drop_arrow_id,
                    container  : id,
                    extra_class: 'uijet_droparrow'
                }, uijet.utils.isObj(options.arrow) ? options.arrow : {});

                // make sure arrow element is set
                if ( ! drop_arrow_config.element ) {
                    drop_arrow = document.createElement('span');
                    drop_arrow.id = drop_arrow_id;
                    drop_arrow_config.element = this.$wrapper[0].appendChild(drop_arrow);
                }
            }

            // ensure all components react to click
            if ( ! drop_menu_events[id + '.clicked'] ) {
                drop_menu_events[id + '.clicked'] = clicked_handler;
            }
            if ( drop_arrow_id && ! drop_menu_events[drop_arrow_id + '.clicked'] ) {
                drop_menu_events[drop_arrow_id + '.clicked'] = clicked_handler;
            }

            // make sure menu element is set
            if ( ! drop_menu_config.element ) {
                drop_menu = document.createElement('ul');
                drop_menu.id = drop_menu_id;
                drop_menu_config.element = (drop_arrow || this.$wrapper[0]).appendChild(drop_menu);
            }
            else {
                drop_menu = uijet.utils.toElement(drop_menu_config.element);

                if ( drop_menu && drop_menu[0] ) {
                    // append the menu element to the widget
                    (drop_arrow || this.$wrapper[0]).appendChild(drop_menu[0]);
                }
            }

            // add the arrow button widget to components if needed
            add_arrow && components.unshift({ type: 'Button', config: drop_arrow_config });

            // make sure the drop menu is Floated
            drop_menu_config.mixins = uijet.utils.putMixin(
                uijet.utils.putMixin(
                    drop_menu_config.mixins,
                    'Floated'),
                'Toggled');

            // create the menu widget
            components.unshift({ type: 'List', config: drop_menu_config });

            return this._super.apply(this, arguments);
        }
    }, {
        widget: 'Button'
    });
}));
