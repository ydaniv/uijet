(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    var layered_widgets = {};

    /**
     * Layered mixin class.
     * 
     * @mixin Layered
     * @category Mixin
     * @extends BaseWidget
     */
    uijet.Mixin('Layered', {
        options         : {
            cloak   : true
        },
        layered         : true,
        /**
         * Registers the widget as a Layered widget under its container widget.
         *
         * @methodOf Layered
         * @returns {Layered}
         */
        register        : function () {
            var res = this._super.apply(this, arguments),
                container;

            // register this instance as a layered widget under its container widget
            if ( !(container = layered_widgets[this.options.container]) ) {
                layered_widgets[this.options.container] = container = [];
            }
            container.push(this);

            return res;
        },
        /**
         * Prepare the top container for being layered.
         * Adds the `layered` class to the top container element.
         *
         * @methodOf Layered
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
         * @methodOf Layered
         * @returns {Layered}
         */
        sleep           : function () {
            this._super();
            (this.$wrapper || this.$element).removeClass('current');
            return this;
        },
        /**
         * Removes this instance from the layered widgets registry.
         *
         * @methodOf Layered
         * @returns {Layered}
         */
        unregister      : function () {
            var res = this._super.apply(this, arguments),
                container = layered_widgets[this.options.container];

            // remove this instance from Layered registry
            container.splice(container.indexOf(this), 1);

            return res;
        },
        /**
         * Enables state of "current" of this layer.
         * Adds the `current` class to the top container element, while calling
         * {@link Layered#sleep} on all of its sibling widgets.
         *
         * @methodOf Layered
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
         * @methodOf Layered
         * @returns {Layered}
         */
        setCurrent      : function () {
            var container_id = this.options.container,
                siblings = (container_id && layered_widgets[container_id]) || [],
                $top = this.$wrapper || this.$element,
                _parent = $top[0].parentNode,
                sibling, sibling_top;

            // loop over sibling widgets
            for ( var l = 0; sibling = siblings[l]; l++ ) {
                // if sibling is awake
                if ( sibling !== this && sibling.awake ) {
                    sibling_top = (sibling.$wrapper || sibling.$element)[0];
                    // and sibling's parent node is same as this instance's element parent node
                    if ( sibling_top && sibling_top.parentNode === _parent ) {
                        // if asked to keep awake
                        if ( sibling.options.keep_layer_awake ) {
                            // just change state from current to simply awake
                            sibling.options.state = 'awake';
                            $top.removeClass('current');
                        }
                        else {
                            // put to sleep
                            sibling.sleep();
                        }
                    }
                }
            }

            this.options.state = 'current';
            $top.addClass('current');

            return this;
        }
    });
}));
