(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Routed', {
        routed          : true,
        destroy         : function () {
            this.notify('pre_destroy');
            this.unsetRoute()
                ._super();
            return this;
        },
        register        : function () {
            this.setRoute()
                .registerRoute()
                ._super();
            return this;
        },
        registerRoute   : function () {
            var _aliases = this.options.alias_routes;
            uijet.setRoute(this);
            if ( _aliases && _aliases.length ) {
                for ( var i = 0, a; a = _aliases[i++]; ) uijet.setRoute(this, a);
            }
            return this;
        },
        checkState      : function () {
            var state = this.$element.attr('data-uijet-state');
            if ( state == 'current' ) {
                this.options.state = state;
            }
            return this;
        },
        setRoute        : function () {
            if ( ! this.options.route ) {
                this.options.route = '#/' + this.id + '/';
            }
            return this;
        },
        unsetRoute      : function (route) {
            uijet.unsetRoute(this, route);
            return this;
        },
        getRoute        : function () {
            return this.options.route;
        },
        run             : function (context) {
            this.notify('pre_run', context);
            this.wake(context, true);
            return this;
        }
    });
}));