// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Pushed', {
        pushed  : true,
        init    : function () {
            var push_config;
            this._super.apply(this, arguments);
            push_config = this.options.push_config;
            if ( push_config && push_config.open_on_init ) {
                this.open();
            }
            return this;
        },
        wake    : function () {
            var push_config = this.options.push_config;
            if ( ! (push_config && push_config.dont_open) ) {
                this.open();
            }
            return this._super.apply(this, arguments);
        },
        sleep   : function () {
            var push_config = this.options.push_config;
            if ( ! (push_config && push_config.keep_open) ) {
                this.close();
            }
            return this._super.apply(this, arguments);
        },
        destroy : function () {
            this.close();
            return this._super.apply(this, arguments);
        },
        getPushUrl: function () {
            return uijet.utils.returnOf(this.options.push_config.url, this, this.getContext());
        },
        open    : function (restart) {
            return this;
        },
        close   : function () {
            return this;
        }
    });
}));
