//TODO: try converting this widget into a mixin
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/mixins/Layered'
        ], function (uijet) {
            return factory(uijet);
        });
    }
    else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Overlay widget class.
     *
     * @class Overlay
     * @category Widget
     * @extends BaseWidget
     * @mixes Layered
     */
    uijet.Widget('Overlay', {
        options  : {
            type_class: 'uijet_overlay'
        },
        /**
         * Invokes {@link Overlay#render} after init.
         *
         * @memberOf Overlay
         * @instance
         * @param {Object} options - passed to `_super()`.
         * @returns {Promise[]|Overlay}
         */
        init     : function (options) {
            // complete `render` on `init`
            var result = this._super(options);
            this.render()
                ._finally();
            return result;
        },
        /**
         * Paints the container and makes sure its hidden.
         *
         * #### Related options:
         *
         * * `darken`: adds the `darken` class to the top container element.
         *
         * @memberOf Overlay
         * @instance
         * @returns {Overlay}
         */
        render   : function () {
            this._super();
            if ( this.$wrapper ) {
                this.$wrapper[0].style.visibility = 'hidden';
            }
            // if `darken` option is set and `true`
            if ( this.options.darken ) {
                // add the `darken` class to the top level element
                (this.$wrapper || this.$element).addClass('darken');
                // no need to repeat this
                delete this.options.darken;
            }
            return this;
        },
        /**
         * Puts the container on top (`z-index`) and make sure it's visible.
         *
         * @memberOf Overlay
         * @instance
         * @returns {Overlay}
         */
        appear   : function () {
            // make this top level by adding `z_top` class
            if ( this.$wrapper ) {
                this.$wrapper.addClass('z_top')[0].style.visibility = 'visible';
            }
            else {
                this.$element.addClass('z_top');
            }
            this._super();
            return this;
        },
        /**
         * Moves the container from the top (`z-index`) and make sure it's hidden.
         *
         * @memberOf Overlay
         * @instance
         * @param {boolean} [no_transitions] - pass to `_super()` call.
         * @returns {Overlay}
         */
        disappear: function (no_transitions) {
            // remove `z_top` class
            if ( this.$wrapper ) {
                this.$wrapper.removeClass('z_top')[0].style.visibility = 'hidden';
            }
            else {
                this.$element.removeClass('z_top');
            }
            this._super(no_transitions);
            return this;
        }
    }, ['Layered']);
}));
