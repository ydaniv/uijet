(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Toggled', {
        options : {
            app_events  : {
                'app.clicked'   : function (event) {
                    var el = this.$element[0],
                        target = event.target;
                    if ( this.opened && el != target && ! uijet.utils.contains(el, target) ) {
                        this.sleep();
                    }
                }
            }
        },
        wake    : function () {
            var result = this._super.apply(this, arguments);
            this.opened = true;
            return result;
        },
        sleep   : function () {
            this.opened = false;
            return this._super.apply(this, arguments);
        },
        toggle  : function (context) {
            this.opened = ! this.opened;
            this.opened ? this.wake(context) : this.sleep();
            return this;
        }
    });
}));
