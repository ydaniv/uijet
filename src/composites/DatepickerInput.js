(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/composites/Datepicker',
            'uijet_dir/mixins/Floated',
            'uijet_dir/mixins/Toggled'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    uijet.Widget('DatepickerInput', {
        options         : {
            type_class  : 'uijet_datepickerinput',
            dom_events  : {
                focus   : function (e) {
                    this.publish('wake_picker');
                }
            }
        },
        init            : function () {
            var result = this._super.apply(this, arguments);
            this.bind(uijet.support.click_events.full, function (e) {
                return false;
            });
            return result;
        },
        prepareElement  : function () {
            var id = this.id,
                left,
                picker_id = id + '_picker',
                datepicker_events = {},
                datepicker_config = {
                    element     : uijet.$('<div>', {
                        id  : picker_id
                    }),
                    id          : picker_id,
                    container   : id,
                    dont_wake   : true,
                    mixins      : ['Floated', 'Toggled'],
                    dateslist   : {
                        signals : {
                            post_select : function () {
                                this.publish('sleep_picker');
                            }
                        }
                    },
                    signals     : {
                        post_init   : function () {
                            this.$wrapper[0].style.left = left + 'px';
                        }
                    },
                    app_events  : datepicker_events
                };

            datepicker_events[id + '.wake_picker'] = 'wake';
            datepicker_events[id + '.sleep_picker'] = 'sleep';

            this._super()
                ._wrap()
                .$wrapper.append(datepicker_config.element);

            left = uijet.utils.getOffsetOf(this.$element[0], this.$wrapper[0]).x;

            uijet.start({
                type    : 'Datepicker',
                config  : uijet.utils.extend(true, this.options.datepicker, datepicker_config)
            });
            return this;
        }
    });
}));
