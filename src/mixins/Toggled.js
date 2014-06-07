(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Toggled mixin class.
     * 
     * @mixin Toggled
     * @category Mixin
     * @extends BaseWidget
     */
    uijet.Mixin('Toggled', {
        /**
         * @member {Object} Toggled#options
         */
        options : {
            /**
             * @member {Object} Toggled#options.app_events
             */
            app_events  : {
                /**
                 * Toggles the widget off, delegating to {@link Toggled#sleep}, if it's
                 * in opened tate, and a click was performed in the app.
                 * 
                 * @member {function} Toggled#options.app_events."app.clicked"
                 * @param {Object} event - `click` event object.
                 */
                'app.clicked'   : function (event) {
                    var el = this.$element[0],
                        target = event.target;
                    if ( this.opened && el != target && ! uijet.utils.contains(el, target) ) {
                        this.sleep();
                    }
                }
            }
        },
        /**
         * Enables opened state.
         * Sets `this.opened` to `true`.
         * 
         * @memberOf Toggled
         * @instance
         * @returns {Toggled}
         */
        wake    : function () {
            var result = this._super.apply(this, arguments);
            this.opened = true;
            return result;
        },
        /**
         * Disables opened state.
         * Sets `this.opened` to `false`.
         * 
         * @memberOf Toggled
         * @instance
         * @returns {Toggled}
         */
        sleep   : function () {
            this.opened = false;
            return this._super.apply(this, arguments);
        },
        /**
         * Toggles opened state (`this.opened`) and in turn
         * toggles the widget state by calling {@link Toggled#wake} or {@link Toggled#sleep}.
         * 
         * @memberOf Toggled
         * @instance
         * @param {*} [context] - a context to pass to {@link Toggled#wake}.
         * @returns {Toggled}
         */
        toggle  : function (context) {
            this.opened = ! this.opened;
            this.opened ? this.wake(context) : this.sleep();
            return this;
        }
    });
}));
