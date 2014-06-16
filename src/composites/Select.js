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
        setSelected : function (toggle) {
            var deferred;
            if ( toggle && toggle.deferred ) {
                deferred = toggle.deferred;
                toggle = toggle.toggle;
            }
            this._super(toggle);
            return deferred ?
                deferred.resolve(this.$selected) :
                this;
        }
    }, {
        widgets : ['List']
    });

    uijet.Widget('Select', {
        options     : {
            type_class  : ['uijet_button', 'uijet_select']
        },
        init        : function () {
            this._super.apply(this, arguments)
                ._wrap();

            var menu_id = this.id + '_menu',
                has_element = this.options.menu && this.options.menu.element,
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
                menu_declaration;

            this.options.content || (this.options.content = uijet.$('<span>').prependTo(this.$element));

            menu_app_events[this.id + '.clicked'] = 'toggle';
            menu_app_events[this.id + '._set_selected'] = 'setSelected+';

            menu_declaration = {
                type    : 'SelectMenu',
                config  : uijet.utils.extend(true, {
                    element     : has_element || uijet.$('<ul>', {
                        id  : menu_id
                    }).appendTo($el),
                    container   : this.id,
                    dont_wake   : true,
                    mixins      : putMixin(putMixin(menu_mixins, 'Toggled'), 'Floated'),
                    type_class  : ['uijet_list', 'uijet_select_menu'], 
                    app_events  : menu_app_events
                }, this.options.menu || {})
            };

            uijet.start(menu_declaration);

            this.subscribe(menu_id + '.selected', this.select);

            return this;
        },
        _setSelected: function ($selected) {
            if ( $selected && $selected.length ) {
                this.options.content.text($selected.text());
            }
            return this;
        },
        setSelected : function (toggle) {
            var deferred = uijet.defer();
            this.publish('_set_selected', {
                toggle  : toggle,
                deferred: deferred
            });
            deferred.promise().then(this._setSelected.bind(this));
            return this;
        },
        select      : function ($selected) {
            this.setSelected($selected);
            this.notify('post_select', $selected);
            return this.publish('selected', $selected);
        }
    }, {
        widgets : ['Button']
    });

}));
