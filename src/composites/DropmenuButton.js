(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/widgets/Button',
            'uijet_dir/widgets/List',
            'uijet_dir/mixins/Floated'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Widget('DropmenuButton', {
        options         : {
            type_class: ['uijet_button', 'uijet_dropmenubutton'],
            dont_wrap   : false
        },
        prepareElement  : function () {
            this._super.apply(this, arguments)
                ._wrap();

            var id = this.id,
                drop_menu_id = id + '_menu',
                options = this.options,
                drop_arrow_id, drop_arrow_config,
                // configure the dropdown menu
                drop_menu_config = uijet.Utils.extend(true, {
                    id              : drop_menu_id,
                    container       : id,
                    dont_wake       : true,
                    sync            : true,
                    dont_select     : true,
                    extra_class     : 'uijet_menu',
                    float_top       : function () {
                        var wrapper = this._wrap().$wrapper[0],
                            parent = wrapper.offsetParent || wrapper.parentNode;
                        while ( parent && parent.nodeType !== 1 ) {
                            parent = parent.parentNode;
                        }
                        return parent ? parent.offsetHeight : 0;
                    },
                    signals         : {
                        pre_select  : function ($selected, e) {
                            var do_select = ! options.menu.dont_select;
                            e.stopPropagation();
                            (this.dont_publish || ! do_select) || this.publish('selected', $selected);
                            this.sleep();
                            return do_select;
                        },
                        pre_sleep   : function () {
                            this.opened = false;
                        }
                    },
                    app_events      : {
                        // in order to stay as less obtrusive as possible sleep when this global event is triggered
                        'app.clicked'   : function (event) {
                            var target_id = event.target.id;
                            if ( this.opened && ! ~ target_id.indexOf(id) ) {
                                this.sleep();
                            }
                        }
                    }
                }, options.menu || {}),
                drop_menu_events = drop_menu_config.app_events,
                clicked_handler = function (data) {
                    var target, top;
                    if ( ! data || data === true ) {
                        this.opened = typeof data == 'boolean' ? data : ! this.opened;
                    }
                    else {
                        target = data.event.target;
                        top = (this.$wrapper || this.$element)[0];
                        // always close if clicked on the menu, otherwise toggle
                        this.opened = !(target === top || uijet.$.contains(top, target)) && ! this.opened;
                    }
                    this.opened ? this.wake() : this.sleep();
                },

                add_arrow = !!(options.add_arrow || options.arrow),
                drop_menu, drop_arrow, floated_index;

            // if we need a separate arrow button configure it
            if ( add_arrow ) {
                drop_arrow_id = id + '_drop_arrow';

                // configure the arrow button
                drop_arrow_config = uijet.Utils.extend(true, {
                    id          : drop_arrow_id,
                    container   : id,
                    extra_class : 'uijet_droparrow'
                }, options.arrow || {});

                // make sure arrow element is set
                if ( ! drop_arrow_config.element ) {
                    drop_arrow = document.createElement('span');
                    drop_arrow.id = drop_arrow_id;
                    drop_arrow_config.element = this.$wrapper[0].appendChild(drop_arrow);
                }
            }

            drop_menu_events[id + '.clicked'] = clicked_handler;
            if ( drop_arrow_id ) {
                drop_menu_events[drop_arrow_id + '.clicked'] = clicked_handler;
            }

            // make sure menu element is set
            if ( ! drop_menu_config.element ) {
                drop_menu = document.createElement('ul');
                drop_menu.id = drop_menu_id;
                drop_menu_config.element = (drop_arrow || this.$wrapper[0]).appendChild(drop_menu);
            }
            else {
                drop_menu = drop_menu_config.element;

                if ( typeof drop_menu == 'string' ) {
                    drop_menu = this.$element.find(drop_menu)[0];
                }
                else if ( drop_menu && drop_menu[0] && drop_menu[0].nodeType ) {
                    drop_menu = drop_menu[0];
                }

                if ( drop_menu && drop_menu.nodeType === 1 ) {
                    (drop_arrow || this.$wrapper[0]).appendChild(drop_menu);
                }
            }

            // create the arrow button widget if needed
            add_arrow && uijet.start({ type: 'Button', config: drop_arrow_config });

            // make sure the drop menu is Floated
            drop_menu_config.mixins = uijet.Utils.putMixin(drop_menu_config.mixins, 'Floated', -1);

            // create the menu widget
            uijet.start({ type: 'List', config: drop_menu_config });

            return this;
        }
    }, {
        widgets : ['Button']
    });
}));
