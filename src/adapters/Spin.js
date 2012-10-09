(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'plugins/spin'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Adapter('Spin', {
        setSpinner  : function (switch_on) {
            var spinner_defaults = {
                    lines       : 12,
                    length      : 12,
                    width       : 6,
                    radius      : 16,
                    color       : '#fff',
                    speed       : 1,
                    trail       : 100,
                    shadow      : true,
                    hwaccel     : false,
                    className   : 'uijet_spin_spinner'
                },
                $el = this.$wrapper || this.$element;
            if ( switch_on ) {
                if ( this.spinner ) {
                    this.spinner.spin($el[0]);
                } else {
                    this.spinner = new Spinner(uijet.Utils.extend(spinner_defaults, this.options.spinner_options || {})).spin($el[0]);
                }
            } else {
                this.spinner && this.spinner.stop();
            }
            return this;
        }
    });
}));