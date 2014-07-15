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
        options     : {
            type_class: ['uijet_list', 'uijet_select_menu'],
            dont_wake : true
        },
        setSelected : function (toggle) {
            var resolve;
            if ( toggle && toggle.resolve ) {
                resolve = toggle.resolve;
                toggle = toggle.toggle;
            }
            this._super(toggle);
            return resolve ?
                   resolve(this.$selected) :
                this;
        }
    }, {
        widgets : ['List']
    });

    uijet.Widget('Select', {
        options      : {
            type_class  : ['uijet_button', 'uijet_select']
        },
        initContained: function () {
            this._wrap();

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

            this.$content = uijet.utils.toElement(this.options.content) || uijet.$('<span>').prependTo(this.$element);

            menu_app_events[this.id + '.clicked'] = 'toggle';
            menu_app_events[this.id + '._set_selected'] = 'setSelected+';

            menu_declaration = {
                type    : 'SelectMenu',
                config  : uijet.utils.extend(true, {
                    element     : has_element || uijet.$('<ul>', {
                        id  : menu_id
                    }).appendTo($el),
                    mixins      : putMixin(putMixin(menu_mixins, 'Toggled'), 'Floated'),
                    app_events  : menu_app_events
                }, this.options.menu || {})
            };

            // move the menu declaration into list of components to be declared 
            if ( !this.options.components ) {
                this.options.components = [];
            }
            this.options.components.unshift(menu_declaration);

            this.subscribe(menu_id + '.selected', this.select);

            return this._super.apply(this, arguments);
        },
        _setSelected : function ($selected) {
            if ( $selected && $selected.length ) {
                this.$content.text($selected.text());
            }
            return this;
        },
        setSelected  : function (toggle) {
            var that = this,
                promise = uijet.Promise(function (resolve) {
                    that.publish('_set_selected', {
                        toggle : toggle,
                        resolve: resolve
                    });
                });
            promise.then(this._setSelected.bind(this));
            return this;
        },
        select       : function ($selected) {
            this.setSelected($selected);
            this.notify('post_select', $selected);
            return this.publish('selected', $selected);
        }
    }, {
        widgets : ['Button']
    });

}));
