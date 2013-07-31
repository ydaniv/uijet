(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Button',
            'uijet_dir/widgets/List'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    uijet.Widget('SelectMenu', {
        setSelected : function () {
            this._super.apply(this, arguments);
            this.sleep();
        }
    }, {
        widgets : 'List'
    });

    uijet.Widget('Select', {
        options : {
            type_class  : ['uijet_button', 'uijet_select'],
            dont_wrap   : false
        },
        init        : function () {
            this._super.apply(this, arguments)
                ._wrap();

            var menu_id = this.id + '_menu',
                has_element = this.options.menu && this.options.menu.element,
                menu_mixins = this.options.menu.mixins,
                $wrapper = this.$wrapper,
                menu_app_events = {
                    //TODO: need to remove this and make it configurable in Toggled mixin
                    'app.clicked'   : function (event) {
                        var el = $wrapper[0],
                            target = event.target;
                        if ( this.opened && el != target && ! uijet.utils.contains(el, target) ) {
                            this.sleep();
                        }
                    }
                },
                putMixin = uijet.utils.putMixin,
                menu_declaration;

            menu_app_events[this.id + '.clicked'] = 'toggle';

            menu_declaration = {
                type    : 'SelectMenu',
                config  : uijet.utils.extend(true, {
                    element     : has_element || uijet.$('<ul>', {
                        id  : menu_id
                    }).appendTo($wrapper),
                    container   : this.id,
                    dont_wake   : true,
                    mixins      : putMixin(putMixin(menu_mixins, 'Toggled'), 'Floated'),
                    type_class  : ['uijet_list', 'uijet_select_menu'], 
                    app_events  : menu_app_events
                }, this.options.menu || {})
            };

            uijet.start(menu_declaration);

            this.subscribe(menu_id + '.selected', function ($selected) {
                (this.options.content || this.$element).text($selected.text());
                this.publish('selected', $selected);
            });

            return this;
        }
    }, {
        widgets : ['Button']
    });

}));
