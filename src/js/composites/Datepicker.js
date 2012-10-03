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

    function isDate (obj) {
        return Object.prototype.toString.call(obj) == '[object Date]';
    }

    uijet.Widget('DatepickerList', {
        init        : function () {
            var id;
            // do init
            this._super.apply(this, arguments);
            // a bit of a hacky way to get the datepicker's original id
            id = this.id.replace('_dateslist', '');
            // subscribe to the next/prev clicks
            this.subscribe(id + '_next.clicked', function () {
                var max_date, go_next = true;
                if ( max_date = this.options.max_date ) {
                    if ( ! isDate(max_date) ) {
                        max_date = new Date(max_date);
                        this.options.max_date = max_date;
                    }
                    go_next = max_date.getMonth() < this.current_date.getMonth();
                }
                go_next && this.next_month();
            }).subscribe(id + '_prev.clicked', function () {
                var min_date, go_prev = true;
                if ( min_date = this.options.min_date ) {
                    if ( ! isDate(min_date) ) {
                        min_date = new Date(min_date);
                        this.options.min_date = min_date;
                    }
                    go_prev = min_date.getMonth() > this.current_date.getMonth();
                }
                go_prev && this.prev_month();
            });
            return this;
        },
        wake        : function () {
            var html, i = 1,
                dates = [],
                last_day = 31,
                now = new Date(),
                current_y = now.getFullYear(),
                current_m = now.getMonth() + (this.month || 0),
                current = new Date(current_y, current_m, (this.current_date || now).getDate()),
                first = new Date(current_y, current_m, 1),
                last = new Date(current_y, current_m, last_day),
                day_offset = first.getDay(),
                $dates;
            this.current_date = current;
            // find the last date of the month
            while ( last.getMonth() > current_m ) {
                last = new Date(current_y, current_m, --last_day);
            }
            // create the list of dates
            while ( i <= last_day ) {
                dates.push(i++);
            }
            // create the HTML
            html = '<li>' + dates.join('</li><li>') + '</li>';
            // insert HTML
            this.$element.html(html);
            $dates = this.$element.children();
            $dates.eq((this.current_date || now).getDate() - 1).addClass('selected');
            // position the dates under the right days of the week using the offset
            this.$element[0]
                .firstElementChild.style.marginLeft = 
                    day_offset * this.$element[0].firstElementChild.offsetWidth + 'px';
            // set current date title
            this.publish(
                '_update_current_date',
                current.toLocaleDateString()
                    // remove day of week
                    .replace(/^[\w]+,\s/, '')
                    // remove day of month
                    .replace(/\s[0-9]+,/, '')
            );
            this._super.apply(this, arguments);
        },
        next_month  : function () {
            if ( this.month === void 0 ) this.month = 0;
            this.month += 1;
            this.wake(true);
            return this;
        },
        prev_month  : function () {
            if ( this.month === void 0 ) this.month = 0;
            this.month -= 1;
            this.wake(true);
            return this;
        }
    }, {
        widgets : ['List']
    });

    uijet.Widget('Datepicker', {
        options : {
            type_class: ['uijet_button','uijet_datepicker']
        },
        prepareElement  : function () {
            var id = this.id,
                $el = this.$element,
                // create all the elements we need to construct our datepicker
                // here is the Floated container
                $container = $('<div/>', {
                    id      : id + '_container',
                    'class' : 'uijet_datepicker_container'
                }).appendTo($el),
                // here's our heading which states current month and year
                $current_date = $('<h1/>', {
                    'class' : 'uijet_datepicker_current_date'
                }).appendTo($container),
                // and here is our list of dates
                $dateslist = $('<ul/>', {
                    id      : id + '_dateslist',
                    'class' : 'uijet_datepicker_dateslist'
                }).appendTo($container),
                // this is the prev month button
                $prev = $('<span/>', {
                    id      : id + '_prev',
                    'class' : 'uijet_datepicker_arrow uijet_datepicker_prev'
                }).prependTo($container),
                // and this is the next month button
                $next = $('<span/>', {
                    id      : id + '_next',
                    'class' : 'uijet_datepicker_arrow uijet_datepicker_next'
                }).appendTo($container),
                // lets configure our container widget
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
                // configure our dates list widget
                dateslist_config = {
                    element     : $dateslist,
                    container   : id + '_container',
                    signals     : {
                        post_select : function ($selected) {
                            this.current_date.setDate(+$selected.text());
                            this.publish(id + '.picked', this.current_date, true);
                        }
                    },
                    app_events  : {}
                },
                floated_index;
            // prepare the element of the datepicker button
            this._super();
            // add user defined options to defaults for container
            container_config = uijet.Utils.extend(true, container_config, this.options.container_options || {});
            // add the waking event handler
            container_config.app_events[id + '.clicked'] = function () {
                this.opened = !this.opened;
                this.opened ? this.wake() : this.sleep();
            };
            container_config.app_events[id + '_dateslist._update_current_date'] = function (text) {
                $current_date.text(text);
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
            // create the dates List
            uijet.startWidget('DatepickerList', dateslist_config);
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