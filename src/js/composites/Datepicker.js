// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['jquery',
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/widgets/Button',
            'uijet_dir/widgets/Pane',
            'uijet_dir/widgets/List',
            'uijet_dir/mixins/Floated'
        ], function ($, uijet) {
            return factory($, uijet);
        });
    } else {
        factory(jQuery, uijet);
    }
}(function ($, uijet) {
    uijet.Widget('Datepicker', {
        options : {
            type_class: ['uijet_button','uijet_datepicker']
        },
        prepareElement: function () {
            var id = this.id,
                $el = this.$element,
                button_height = $el[0].offsetHeight + $el[0].offsetTop,
                $container = $('<div/>', {
                    id      : id + '_container',
                    'class' : 'uijet_datepicker_container'
                }).appendTo($el),
                $current_date = $('<h1/>', {
                    'class' : 'uijet_datepicker_current_date'
                }).appendTo($container),
                $prev = $('<span/>', {
                    id      : id + '_prev',
                    'class' : 'uijet_datepicker_arrow uijet_datepicker_prev'
                }).prependTo($container),
                $next = $('<span/>', {
                    id      : id + '_next',
                    'class' : 'uijet_datepicker_arrow uijet_datepicker_next'
                }).appendTo($container),
                container_config = {
                    element     : $container,
                    container   : id,
                    dont_wake   : true,
                    sync        : true,
                    float_top   : function () {
                        return this.$wrapper[0].offsetParent.offsetHeight;
                    },
                    signals     : {
                        pre_sleep   : function () {
                            this.opened = false;
                        }
                    },
                    app_events  : {
                        // in order to stay as less obtrusive as possible sleep when this global event is triggered
                        'app.clicked'   : function (_id) {
                            if ( this.opened && (! _id || ! ~ _id.indexOf(id)) ) {
                                this.sleep();
                            }
                        }
                    }
                },
                dateslist_config = {
                    element     : $('<ul/>', {
                        id      : id + '_dateslist',
                        'class' : 'uijet_datepicker_dateslist'
                    }).appendTo($container),
                    container   : id + '_container',
                    signals     : {
                        pre_wake    : function () {
                            var html, i = 1,
                                dates = [],
                                last_day = 31,
                                now = new Date(),
                                current_y = now.getFullYear(),
                                current_m = now.getMonth() + (this.month || 0),
                                current = new Date(current_y, current_m, (this.current_date || now).getDate()),
                                first = new Date(current_y, current_m, 1),
                                last = new Date(current_y, current_m, last_day),
                                day_offset = first.getDay();
                            this.current_date = current;
                            // find the last date of the month
                            while ( last.getMonth() > current_m ) {
                                last = new Date(current_y, current_m, --last_day);
                            }
                            // cteate the list of dates
                            while ( i <= last_day ) {
                                dates.push(i++);
                            }
                            // create the HTML
                            html = '<li>' + dates.join('</li><li>') + '</li>';
                            // insert HTML
                            this.$element.html(html);
                            this.$element.children().eq((this.current_date || now).getDate() - 1).addClass('selected');
                            // position the dates under the right days of the week using the offset
                            this.$element[0].firstElementChild.style.marginLeft = day_offset * this.$element[0].firstElementChild.offsetWidth + 'px';
                            // set current date title
                            $current_date.text(current.toLocaleDateString().replace(/^[\w]+,\s/, '').replace(/\s[0-9]+,/, ''));
                        },
                        post_select : function ($selected) {
                            this.current_date.setDate(+$selected.text());
                            this.publish(id + '.picked', this.current_date, true);
                        }
                    },
                    app_events  : {}
                },
                floated_index;
            this._super();
            // add user defined options to defaults for container
            container_config = uijet.Utils.extend(true, container_config, this.options.container_options || {});
            // add the waking event handler
            container_config.app_events[id + '.clicked'] = function () {
                this.opened = !this.opened;
                this.opened ? this.wake() : this.sleep();
            };
            // make sure the container is Floated
            if ( container_config.mixins ) {
                container_config.mixins = uijet.Utils.toArray(container_config.mixins);
                floated_index = container_config.mixins.indexOf('Floated');
                // check if we have Floated mixed-in
                if ( ~ floated_index ) {
                    // remove Floated from mixins list
                    container_config.mixins.splice(floated_index, 1);
                }
                // put Floated at the top of the chain to make sure its `appear` and `disappear` are called first
                container_config.mixins.push('Floated');
            } else {
                // just add it if otherwise
                container_config.mixins = 'Floated';
            }
            // create the container Pane
            uijet.startWidget('Pane', container_config);
            // add user defined options to defaults for dates list
            dateslist_config = uijet.Utils.extend(true, dateslist_config, this.options.dateslist_options || {});
            //
            dateslist_config.app_events[id + '_next.clicked'] = function () {
                if ( this.month === void 0 ) this.month = 0;
                this.month += 1;
                this.wake(true);
            };
            dateslist_config.app_events[id + '_prev.clicked'] = function () {
                if ( this.month === void 0 ) this.month = 0;
                this.month -= 1;
                this.wake(true);
            };
            // create the dates List
            uijet.startWidget('List', dateslist_config);
            // create the next/prev buttons
            uijet.startWidget('Button', {
                element     : $next,
                id          : id + '_next',
                container   : id + '_container'
            });
            uijet.startWidget('Button', {
                element     : $prev,
                id          : id + '_prev',
                container   : id + '_container'
            });
            return this;
        }
    }, {
        widgets : ['Button']
    });
}));