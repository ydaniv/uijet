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
    }
    else {
        factory(uijet);
    }
}(function (uijet) {

    function isDate (obj) {
        return Object.prototype.toString.call(obj) == '[object Date]';
    }

    /**
     * Datepicker composite class.
     *
     * @class Datepicker
     * @extends BaseWidget
     * @category Composite
     */
    uijet.Widget('Datepicker', {
        options      : {
            type_class: ['uijet_pane', 'uijet_datepicker'],
            sync      : true
        },
        /**
         * Translate the `datelist`, `next` and `prev` option into a part of the `components` option.
         *
         * #### App events:
         *
         * * `<id>_datelist._update_current_date`: this widget registers to this event to update the
         * `current_date` element's content with current selected date.
         *
         * #### Related options:
         *
         * * `datelist`: config objects for the DateList component to create.
         * * `next`: config objects for the next Button component to create.
         * * `prev`: config objects for the prev Button component to create.
         * * `current_date`: element or selector for the element which will serve as the heading
         * that contains cuurent date.
         * * `max_date`: max possible date for selection.
         * * `min_date`: min possible date for selection.
         *
         * @methodOf Datepicker
         * @returns {Datepicker}
         */
        initContained: function () {
            var $ = uijet.$,
                id = this.id,
                $el = this.$element,
                datepiker_ops = this.options,
                datelist_ops = datepiker_ops.datelist || {},
                prev_ops = datepiker_ops.prev || {},
                next_ops = datepiker_ops.next || {},
                components = datepiker_ops.components,

            // create all the elements we need to construct our datepicker
            // here's our heading which states current month and year
                $current_date = uijet.utils.toElement(datepiker_ops.current_date) || $('<h1>', {
                    'class': 'uijet_datepicker_current_date'
                }).appendTo($el),

            // this is the prev month button
                $prev = prev_ops.element || $('<span>', {
                    id     : id + '_prev',
                    'class': 'uijet_datepicker_arrow uijet_datepicker_prev'
                }).prependTo($el),

            // and this is the next month button
                $next = next_ops.element || $('<span>', {
                    id     : id + '_next',
                    'class': 'uijet_datepicker_arrow uijet_datepicker_next'
                }).appendTo($el),

            // and here is our list of dates
                $datelist = datelist_ops.element || $('<ul>', {
                    id: id + '_datelist'
                }).appendTo($el),

            // configure our dates list widget
                datelist_config = uijet.utils.extend(true, {
                    element  : $datelist,
                    container: id,
                    signals  : {
                        pre_select: function ($selected, e) {
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
                    min_date : datepiker_ops.min_date,
                    max_date : datepiker_ops.max_date
                }, datelist_ops);

            this.subscribe(id + '_datelist._update_current_date', function (text) {
                $current_date.text(text);
            });

            // add the dates List to components
            components.push({ type: 'DateList', config: datelist_config });

            // add the next/prev Buttons to components
            components.push({ type: 'Button', config: uijet.utils.extend(true, {
                element  : $next,
                id       : id + '_next',
                container: id
            }, datepiker_ops.next || {}) });
            components.push({ type: 'Button', config: uijet.utils.extend(true, {
                element  : $prev,
                id       : id + '_prev',
                container: id
            }, datepiker_ops.prev || {}) });

            return this._super.apply(this, arguments);
        }
    });

    /**
     * DateList composite class.
     *
     * @class DateList
     * @extends List
     * @category Composite
     */
    uijet.Widget('DateList', {
        options      : {
            type_class: ['uijet_list', 'uijet_datelist']
        },
        /**
         * Subscribe to next/prev button clicks.
         *
         * #### Related options:
         *
         * * `max_date`: max possible date for selection. Usually set by the container Datepicker.
         * * `min_date`: min possible date for selection. Usually set by the container Datepicker.
         *
         * @methodOf DateList
         * @returns {Promise[]|DateList}
         */
        init         : function () {
            var now = new Date(),
                container_id = this.container,
                min_date, result;

            this.month = now.getMonth();
            this.year = now.getFullYear();

            this.holdSignal('post_init');
            // do init
            result = this._super.apply(this, arguments);

            // subscribe to the next/prev clicks
            this.subscribe(container_id + '_next.clicked', function () {
                var max_year, current_year, max_date, go_next = true;
                if ( max_date = this.options.max_date ) {
                    max_year = max_date.getFullYear();
                    current_year = this.current_date.getFullYear();
                    go_next = max_year > current_year ||
                              (max_year === current_year && max_date.getMonth() > this.current_date.getMonth());
                }
                go_next && this.nextMonth().wake(true);
            }).subscribe(container_id + '_prev.clicked', function () {
                var min_year, current_year, min_date, go_prev = true;
                if ( min_date = this.options.min_date ) {
                    min_year = min_date.getFullYear();
                    current_year = this.current_date.getFullYear();
                    go_prev = min_year < current_year ||
                              (min_year === current_year && min_date.getMonth() < this.current_date.getMonth());
                }
                go_prev && this.prevMonth().wake(true);
            });

            // make sure min/max dates are instances of `Date` object
            if ( min_date = this.options.min_date ) {
                if ( !isDate(min_date) ) {
                    min_date = new Date(min_date);
                    this.options.min_date = min_date;
                }
            }
            if ( min_date = this.options.min_date ) {
                if ( !isDate(min_date) ) {
                    min_date = new Date(min_date);
                    this.options.min_date = min_date;
                }
            }

            this.releaseSignal('post_init');

            return result;
        },
        /**
         * Renders the date list.
         *
         * #### App events:
         *
         * * `<id>._update_current_date`: triggered after content is re-rendered so selection can be synced.
         *
         * @methodOf DateList
         * @returns {DateList}
         */
        render       : function () {
            var dates = this._datesOfMonth(),
                width = this.$element[0].firstElementChild.offsetWidth,
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
            this.$element[0].firstElementChild.style.marginLeft = this.day_offset * width + 'px';

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
        /**
         * Changes state to next month.
         *
         * @methodOf DateList
         * @returns {DateList}
         */
        nextMonth    : function () {
            this.month += 1;
            if ( this.month === 12 ) {
                this.nextYear().month = 0;
            }
            return this;
        },
        /**
         * Changes state to previous month.
         *
         * @methodOf DateList
         * @returns {DateList}
         */
        prevMonth    : function () {
            this.month -= 1;
            if ( this.month === -1 ) {
                this.prevYear().month = 11;
            }
            return this;
        },
        /**
         * Changes state to next year.
         *
         * @methodOf DateList
         * @returns {DateList}
         */
        nextYear     : function () {
            this.year += 1;
            return this;
        },
        /**
         * Changes state to previous month.
         *
         * @methodOf DateList
         * @returns {DateList}
         */
        prevYear     : function () {
            this.year -= 1;
            return this;
        },
        /**
         * Generates a list of possible dates of current month
         * as a list of integers, starting from 1 and ending
         * at current month's last day.
         *
         * @methodOf DateList
         * @returns {number[]} - array of integers representing the possible dates of current month.
         */
        _datesOfMonth: function () {
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
            while ( last.getMonth() > current_m ) {
                last = new Date(current_y, current_m, --last_day);
            }

            // create the list of dates
            while ( i <= last_day ) {
                dates.push(i++);
            }

            return dates;
        }
    }, {
        widgets: ['List']
    });
}));
