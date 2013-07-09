(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Pane',
            'uijet_dir/widgets/List',
            'uijet_dir/widgets/Button'
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

    uijet.Widget('Datepicker', {
        options     : {
            type_class  : ['uijet_pane', 'uijet_datepicker'],
            sync        : true
        },
        prepareElement  : function () {
            var $ = uijet.$,
                id = this.id,
                $el = this.$element,
                datepiker_ops = this.options,

                // create all the elements we need to construct our datepicker
                // here's our heading which states current month and year
                $current_date = $('<h1/>', {
                    'class' : 'uijet_datepicker_current_date'
                }).appendTo($el),

                // this is the prev month button
                $prev = $('<span/>', {
                    id      : id + '_prev',
                    'class' : 'uijet_datepicker_arrow uijet_datepicker_prev'
                }).prependTo($el),

                // and this is the next month button
                $next = $('<span/>', {
                    id      : id + '_next',
                    'class' : 'uijet_datepicker_arrow uijet_datepicker_next'
                }).appendTo($el),

                // and here is our list of dates
                $dateslist = $('<ul/>', {
                    id      : id + '_dateslist'
                }).appendTo($el),

                // configure our dates list widget
                dateslist_config = {
                    element     : $dateslist,
                    container   : id,
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
                            uijet.publish(id + '.picked', this.current_date);
                        }
                    },
                    app_events  : {},
                    min_date    : datepiker_ops.min_date,
                    max_date    : datepiker_ops.max_date
                };

            this._super();

            this.subscribe(id + '_dateslist._update_current_date', function (text) {
                $current_date.text(text);
            });

            // add user defined options to defaults for dates list
            dateslist_config = uijet.utils.extend(true, dateslist_config, datepiker_ops.dateslist || {});
            // create the dates List
            uijet.start({ type: 'DatepickerList', config: dateslist_config });
            // create the next/prev buttons
            uijet.start({ type: 'Button', config: uijet.utils.extend(true, {
                element     : $next,
                id          : id + '_next',
                container   : id
            }, datepiker_ops.next || {}) });
            uijet.start({ type: 'Button', config: uijet.utils.extend(true, {
                element     : $prev,
                id          : id + '_prev',
                container   : id
            }, datepiker_ops.prev || {}) });

            return this;
        }
    });

    uijet.Widget('DatepickerList', {
        options : {
            type_class  : ['uijet_list', 'uijet_datepicker_list']
        },
        init        : function () {
            var now = new Date(),
                id, min_date;

            this.month = now.getMonth();
            this.year = now.getFullYear();

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
                go_next && this.nextMonth().wake(true);
            }).subscribe(id + '_prev.clicked', function () {
                var min_year, current_year, min_date, go_prev = true;
                if ( min_date = this.options.min_date ) {
                    min_year = min_date.getFullYear();
                    current_year = this.current_date.getFullYear();
                    go_prev = min_year < current_year || (min_year === current_year && min_date.getMonth() < this.current_date.getMonth());
                }
                go_prev && this.prevMonth().wake(true);
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
        datesOfMonth: function () {
            var i = 1,
                dates = [],
                last_day = 31,
                now = new Date(),
                current_y = this.year,
                current_m = this.month,
                current = new Date(current_y, current_m, (this.current_date || now).getDate()),
                first = new Date(current_y, current_m, 1),
                last = new Date(current_y, current_m, last_day);

            this.current_date = current;
            this.now = now;
            this.day_offset = first.getDay();

            // find the last date of the month
            while ( last.getMonth() > current_m )
                last = new Date(current_y, current_m, --last_day);

            // create the list of dates
            while ( i <= last_day )
                dates.push(i++);

            return dates;
        },
        render      : function () {
            var dates = this.datesOfMonth(),
                html, $dates, min_date, max_date;
            
            // create the HTML
            html = '<li>' + dates.join('</li><li>') + '</li>';

            // insert HTML
            this.$element.html(html);

            $dates = this.$element.children();
            // make current date selected
            $dates.eq((this.current_date || this.now).getDate() - 1).addClass('selected');

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
                    this.day_offset * this.$element[0].firstElementChild.offsetWidth + 'px';
            // set current date title
            this.publish(
                '_update_current_date',
                this.current_date.toLocaleDateString()
                    // remove day of week
                    .replace(/^[\w]+,\s/, '')
                    // remove day of month
                    .replace(/\s[0-9]+,/, '')
            );
            return this._super.apply(this, arguments);
        },
        nextMonth   : function () {
            this.month += 1;
            if ( this.month === 12 ) {
                this.nextYear().month = 0;
            }
            return this;
        },
        prevMonth   : function () {
            this.month -= 1;
            if ( this.month === -1 ) {
                this.prevYear().month = 11;
            }
            return this;
        },
        nextYear    : function () {
            this.year += 1;
            return this;
        },
        prevYear    : function () {
            this.year -= 1;
            return this;
        }
    }, {
        widgets : ['List']
    });
}));
