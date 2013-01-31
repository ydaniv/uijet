// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/widgets/Button',
            'uijet_dir/widgets/Pane',
            'uijet_dir/widgets/List',
            'uijet_dir/mixins/Floated'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    function isDate (obj) {
        return Object.prototype.toString.call(obj) == '[object Date]';
    }

    uijet.Widget('DatepickerContainer', {
        options     : {
            type_class  : ['uijet_pane', 'uijet_datepicker_container']
        },
        appear      : function () {
            var offset, style;
            if ( ! this.options.dont_fix_overflow ) {
                offset = uijet.Utils.getOffsetOf(this.context.event.target, uijet.$element[0]);
                style = this.$wrapper[0].style;
                style.top = offset.y + 'px';
                style.left = offset.x + 'px';
            }
            return this._super.apply(this, arguments);
        },
        disappear   : function () {
            var style;
            this._super.apply(this, arguments);
            if ( ! this.options.dont_fix_overflow ) {
                style = this.$wrapper[0].style;
                style.removeProperty('top');
                style.removeProperty('left');
            }
            return this;
        },
        sleep       : function () {
            this.opened = false;
            return this._super.apply(this, arguments);
        }
    });

    uijet.Widget('DatepickerList', {
        options : {
            type_class  : ['uijet_list', 'uijet_datepicker_list']
        },
        init        : function () {
            var id, min_date, max_date;
            // do init
            this._super.apply(this, arguments);
            // a bit of a hacky way to get the datepicker's original id
            id = this.id.replace('_dateslist', '');
            // subscribe to the next/prev clicks
            this.subscribe(id + '_next.clicked', function () {
                var max_year, current_year, max_date, go_next = true;
                if ( max_date = this.options.max_date ) {
                    max_year = max_date.getFullYear();
                    current_year = this.current_date.getFullYear();
                    go_next = max_year > current_year || (max_year === current_year && max_date.getMonth() > this.current_date.getMonth());
                }
                go_next && this.next_month();
            }).subscribe(id + '_prev.clicked', function () {
                var min_year, current_year, min_date, go_prev = true;
                if ( min_date = this.options.min_date ) {
                    min_year = min_date.getFullYear();
                    current_year = this.current_date.getFullYear();
                    go_prev = min_year < current_year || (min_year === current_year && min_date.getMonth() < this.current_date.getMonth());
                }
                go_prev && this.prev_month();
            });
            // make sure min/max dates are instances of `Date` object
            if ( min_date = this.options.min_date ) {
                if ( ! isDate(min_date) ) {
                    min_date = new Date(min_date);
                    this.options.min_date = min_date;
                }
            }
            if ( min_date = this.options.min_date ) {
                if ( ! isDate(min_date) ) {
                    min_date = new Date(min_date);
                    this.options.min_date = min_date;
                }
            }
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
                $dates, min_date, max_date;
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

            // handle special cases
            if ( max_date = this.options.max_date ) {
                // if we're on the same month as the `max_date`
                if ( max_date.getMonth() === this.current_date.getMonth() ) {
                    uijet.$($dates).slice(max_date.getDate()).addClass('disabled');
                }
            }
            if ( min_date = this.options.min_date ) {
                // if we're on the same month as the `min_date`
                if ( min_date.getMonth() === this.current_date.getMonth() ) {
                    uijet.$($dates).slice(0, min_date.getDate() - 2).addClass('disabled');
                }
            }

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
            return this._super.apply(this, arguments);
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
            var $ = uijet.$,
                id = this.id,
                $el = this.$element,
                datepiker_ops = this.options.datepicker || {},
                // create all the elements we need to construct our datepicker
                // here is the Floated container
                $container = $('<div/>', {
                    id      : id + '_container'
                }),
                // here's our heading which states current month and year
                $current_date = $('<h1/>', {
                    'class' : 'uijet_datepicker_current_date'
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
                // and here is our list of dates
                $dateslist = $('<ul/>', {
                    id      : id + '_dateslist'
                }).appendTo($container),
                // lets configure our container widget
                container_config = {
                    element     : $container,
                    container   : id,
                    dont_wake   : true,
                    sync        : true,
                    app_events  : {
                        // in order to stay as less obtrusive as possible sleep when this global event is triggered
                        'app.clicked'   : function (_data) {
                            if ( this.opened && (! _data || ! _data.id || ! ~ _data.id.indexOf(id)) ) {
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
                        pre_select  : function ($selected, e) {
                            // if this date is disabled bail out
                            if ( $selected.hasClass('disabled') ) {
                                e.stopPropagation();
                                return false;
                            }
                            // set `current_date`
                            this.current_date.setDate(+$selected.text());
                            // publish the 'picked' event
                            this.publish(id + '.picked', this.current_date, true);
                        }
                    },
                    app_events  : {},
                    min_date    : datepiker_ops.min_date,
                    max_date    : datepiker_ops.max_date
                },
                floated_index;
            // prepare the element of the datepicker button
            this._super();
            // add user defined options to defaults for container
            container_config = uijet.Utils.extend(true, container_config, datepiker_ops.container || {});
            // add the waking event handler
            container_config.app_events[id + '.clicked'] = function (data) {
                this.opened = !this.opened;
                this.opened ? this.wake(data) : this.sleep();
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
            // if user hasn't overridden `element` option
            if ( $container === container_config.element ) {
                // if specified by the user
                if ( container_config.dont_fix_overflow ) {
                    // build the datepicker inside the containing Button widget
                    // this generates a cleaner and self contained DOM structure
                    $container.appendTo($el);
                    // if `float_top` option is not set
                    if ( ! ('float_top' in container_config) ) {
                        // set it to place the container below the parent button
                        container_config.float_top = function () {
                            return this.$wrapper[0].offsetParent.offsetHeight;
                        }
                    }
                }
                // otherwise
                else {
                    // build the datepicker in the app's top level element to fix the `overflow:hidden` on parent issue
                    $container.appendTo(uijet.$element);
                }
            }
            // create the container Pane
            uijet.start({ type: 'DatepickerContainer', config: container_config });
            // add user defined options to defaults for dates list
            dateslist_config = uijet.Utils.extend(true, dateslist_config, datepiker_ops.dateslist || {});
            // create the dates List
            uijet.start({ type: 'DatepickerList', config: dateslist_config });
            // create the next/prev buttons
            uijet.start({ type: 'Button', config: uijet.Utils.extend(true, {
                element     : $next,
                id          : id + '_next',
                container   : id + '_container'
            }, datepiker_ops.next || {}) });
            uijet.start({ type: 'Button', config: uijet.Utils.extend(true, {
                element     : $prev,
                id          : id + '_prev',
                container   : id + '_container'
            }, datepiker_ops.prev || {}) });
            return this;
        }
    }, {
        widgets : ['Button']
    });
}));