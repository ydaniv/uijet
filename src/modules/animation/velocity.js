(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'velocity',
            'uijet_dir/mixins/Transitioned'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(this, function (uijet) {

    /**
     * Velocity.js animation module.
     * 
     * @module animation/velocity
     * @extends uijet
     */

    uijet.use({
        options: {
            animation_type: { opacity: [1, 0] }
        },
        /**
         * Transitions a widget's element into or out of view.
         * 
         * #### Related options:
         * 
         * * `animation_type`: the animation configuration to perform. Defaults to `uijet.options.animation_type` which defaults to `{ opacity: [1, 0] }`.
         * 
         * @memberOf module:animation/velocity
         * @param {Widget} widget - the widget instance to transition.
         * @param {string} [direction] - direction of transition - `'in'` or `'out'`. Defaults to `'in'`.
         * @param {function} [callback] - callback to invoke at end of transition.
         * @returns {uijet}
         */
        //TODO: implement support for Sequences as transitions: http://julian.com/research/velocity/#sequences
        transit             : function (widget, direction, callback) {
            var transit_type = widget.options.animation_type || this.options.animation_type,
                $el = (widget.$wrapper || widget.$element),
                is_direction_in;

            direction = direction || 'in';
            is_direction_in = direction == 'in';

            if ( callback ) {
                callback = callback.bind(widget);
            }

            if ( is_direction_in ) {
                if ( uijet.utils.isArr(transit_type) ) {
                    // if there's a callback to run and there's an options object 
                    if ( callback && uijet.utils.isObj(transit_type[1]) ) {
                        // add callback as the complete function
                        transit_type[1].complete = callback;
                    } 
                    $el.velocity.apply($el, transit_type);
                }
                else if ( uijet.utils.isObj(transit_type) ) {
                    // if there's a callback to run and there's an options object
                    if ( callback && transit_type.options ) {
                        // add callback as the complete function
                        transit_type.options.complete = callback;
                    }
                    $el.velocity(transit_type.properties, transit_type.options, transit_type.easing);
                }
            }
            else {
                $el.velocity('reverse', (callback && { complete : callback }));
            }

            return this;
        },
        /**
         * Animates an elements' properties.
         * 
         * @memberOf module:animation/velocity
         * @param {HTMLElement[]} $el - wrapped HTMLElement to animate.
         * @param {string|Object} props - valid CSS text to set on the element's style, or a map of style properties.
         * @param {Object|number} [options] - config object or duration in milliseconds.
         * @param {stirng|Array} [easing] - easing function name or array of values for generating an easing function.
         */
        animate             : function ($el, props, options, easing) {
            $el.velocity(props, options, easing);
        }
    }, uijet);
}));
