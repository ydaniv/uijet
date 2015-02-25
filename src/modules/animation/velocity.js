(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'velocity',
            'uijet_dir/mixins/Transitioned'
        ], function (uijet, Velocity) {
            return factory(uijet, Velocity);
        });
    } else {
        factory(root.uijet, root.Velocity || root.$ && root.$.Velocity);
    }
}(this, function (uijet, Velocity) {

    /**
     * Velocity.js animation module.
     * 
     * @module animation/velocity
     * @category Module
     * @sub-category Animation
     * @extends uijet
     */

    uijet.use({
        options: {
            transition: [{ opacity: [1, 0] }]
        },
        /**
         * Transitions a widget's element into or out of view.
         * 
         * #### Related options:
         *
         * * `transition`: the transition configuration to perform. Defaults to `uijet.options.transition` which defaults to `{ opacity: [1, 0] }` (fade).
         *
         * @method module:animation/velocity#transit
         * @param {Widget} widget - the widget instance to transition.
         * @param {string} [direction] - direction of transition - `'in'` or `'out'`. Defaults to `'in'`.
         * @param {function} [callback] - callback to invoke at end of transition.
         * @returns {uijet}
         */
        transit             : function (widget, direction, callback) {
            var transit_type = widget.options.transition || this.options.transition,
                $el = (widget.$wrapper || widget.$element),
                is_direction_in, result;

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
                    result = Velocity.animate.apply(Velocity, [$el[0]].concat(transit_type));
                }
                else if ( uijet.utils.isObj(transit_type) ) {
                    // if there's a callback to run and there's an options object
                    if ( callback && transit_type.options ) {
                        // add callback as the complete function
                        transit_type.options.complete = callback;
                    }
                    result = Velocity.animate($el[0], transit_type.properties, transit_type.options, transit_type.easing);
                }
            }
            else {
                result = Velocity.animate($el[0], 'reverse', (callback && { complete : callback }));
            }

            return result;
        },
        /**
         * Animates an elements' properties.
         *
         * @method module:animation/velocity#animate
         * @param {HTMLElement[]} $el - wrapped HTMLElement to animate.
         * @param {string|Object} props - valid CSS text to set on the element's style, or a map of style properties.
         * @param {Object|number} [options] - config object or duration in milliseconds.
         * @param {string|Array} [easing] - easing function name or array of values for generating an easing function.
         */
        animate             : function ($el, props, options, easing) {
            return Velocity.animate($el[0], props, options, easing);
        }
    }, uijet);

    return Velocity;
}));
