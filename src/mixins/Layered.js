(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Layered mixin class.
     * 
     * @mixin Layered
     * @extends uijet.BaseWidget
     */
    uijet.Mixin('Layered', {
        options         : {
            cloak   : true
        },
        layered         : true,
        /**
         * Prepare the top container for being layered.
         * Adds the `layered` class to the top container element.
         * 
         * @memberOf Layered
         * @instance
         * @returns {Layered}
         */
        prepareElement  : function () {
            this._super();
            // since this relies on CSS this mixin must be included in the right order in relation to other mixins
            // to make sure that the proper element is used below and, for example. that `setCurrent` is called in
            // the right order with `transit`.
            (this.$wrapper || this.$element).addClass('layered');
            return this;
        },
        /**
         * Disables state of "current" of this layer.
         * Removes the `current` class from the top container element.
         * 
         * @memberOf Layered
         * @instance
         * @returns {Layered}
         */
        sleep           : function () {
            this._super();
            (this.$wrapper || this.$element).removeClass('current');
            return this;
        },
        /**
         * Enables state of "current" of this layer.
         * Adds the `current` class to the top container element, while calling
         * {@link Layered#sleep} on all of its sibling widgets.
         * 
         * @memberOf Layered
         * @instance
         * @returns {Layered}
         */
        appear          : function () {
            this.setCurrent()
                ._super();
            return this;
        },
        /**
         * Sets this instance as the current top layer among its siblings
         * that share same DOM parent element.
         * 
         * #### Related options:
         * 
         * * `keep_layer_awake`: if set on a sibling widget instance, that instance will not be put to {@link Layered#sleep} once
         * this instance awakes.
         * 
         * @memberOf Layered
         * @instance
         * @returns {Layered}
         */
        setCurrent      : function () {
            uijet._switchLayer(this);
            return this;
        }
    });
}));
