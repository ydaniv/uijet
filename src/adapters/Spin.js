(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'spin'], function (uijet, Spinner) {
            return factory(uijet, Spinner);
        });
    } else {
        factory(uijet, Spinner);
    }
}(function (uijet, Spinner) {
    uijet.Adapter('Spin', {
        spin        : function () {
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

            if ( this.spinner ) {
                this.spinner.spin($el[0]);
            } else {
                this.spinner = new Spinner(uijet.Utils.extend(spinner_defaults, this.options.spinner_options || {})).spin($el[0]);
            }
            this.spin_on = true;

            return this;
        },
        spinOff     : function () {
            this.spinner && this.spinner.stop();
            this.spin_on = false;
            return this;
        },
        spinToggle  : function (switch_on) {
            typeof switch_on == 'boolean' ?
                switch_on ?
                    this.spin() :
                    this.spinOff() :
                this.spin_on ?
                    this.spinOff() :
                    this.spin();
            return this;
        }
    });
}));
