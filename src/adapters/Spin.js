(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'spin'], function (uijet, Spinner) {
            return factory(uijet, Spinner);
        });
    } else {
        factory(uijet, Spinner);
    }
}(function (uijet, Spinner) {

    /**
     * Spin.js adapter class.
     * 
     * @class Spin
     * @category Adapter
     * @extends uijet.BaseWidget
     * @see {@link http://fgnass.github.io/spin.js/}
     */
    uijet.Adapter('Spin', {
        /**
         * Initializes a spinner and turns it on.
         * 
         * #### Related options:
         * 
         * * `spinner_options`: config object for the spinner instance constructor. 
         * 
         * The above config object can take an extra option `element` which can be an element, query selector,
         * or a function returning one of these, to use as the spinner's container.
         * 
         * @memberOf Spin
         * @instance
         * @returns {Widget} this
         */
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
                options = uijet.utils.extend(spinner_defaults, this.options.spinner_options || {}),
                element, $el;

            if ( options.element ) {
                element = options.element;
                if ( uijet.utils.isFunc(element) ) {
                    $el = uijet.utils.returnOf(element, this);
                }
                else {
                    $el = uijet.utils.toElement(element);
                }
                delete options.element;
            }
            else {
                $el = this.$wrapper || this.$element
            }

            if ( this.spinner ) {
                this.spinner.spin($el[0]);
            } else {
                this.spinner = new Spinner(options).spin($el[0]);
            }
            this.spin_on = true;

            return this;
        },
        /**
         * Turns the spinner off.
         * 
         * @memberOf Spin
         * @instance
         * @returns {Widget} this
         */
        spinOff     : function () {
            this.spinner && this.spinner.stop();
            this.spin_on = false;
            return this;
        },
        /**
         * Toggles the spinner.
         * 
         * @memberOf Spin
         * @instance
         * @param {boolean} [switch_on] - enforces toggling on or off. If `true` then toggled to on.
         * @returns {Widget} this
         */
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
