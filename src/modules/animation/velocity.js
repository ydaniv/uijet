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

    var CALLBACK_PROP_NAMES = ['complete', 'begin'];

    function _bindCallbacks (options, widget) {
        CALLBACK_PROP_NAMES.forEach(function (name) {
            if ( uijet.utils.isFunc(options[name]) ) {
                options[name] = options[name].bind(widget);
            }
        });
    }

    function _parseTransitionConfig (config, widget) {
        if ( uijet.utils.isArr(config) ) {
            // bind the complete callback if it exists
            if ( uijet.utils.isObj(config[1]) ) {
                _bindCallbacks(config[1], widget);
            }
            // bind the complete callback if it is passed directly as a third argument
            if ( uijet.utils.isFunc(config[2]) ) {
                config[2] = config[2].bind(widget);
            }
            // bind the complete callback if it is passed directly as a fourth argument
            if ( uijet.utils.isFunc(config[3]) ) {
                config[3] = config[3].bind(widget);
            }
            return config;
        }
        else if ( uijet.utils.isObj(config) ) {
            // if there's a callback to run and there's an options object
            if ( config.options || config.o ) {
                // add callback as the complete function
                _bindCallbacks(config.options || config.o, widget);
            }
            return [config.properties || config.p, config.options || config.o, config.easing || config.e];
        }
    }

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
         * * `transition_reverse`: the reverse transition configuration to perform. Defaults to `'reverse'` which reverses the `in` transition.
         *
         * @method module:animation/velocity#transit
         * @param {Widget} widget - the widget instance to transition.
         * @param {string} [direction] - direction of transition - `'in'` or `'out'`. Defaults to `'in'`.
         * @returns {Promise} - promise object returned by the `Velocity.animate()` call.
         */
        transit             : function (widget, direction) {
            var $el = (widget.$wrapper || widget.$element),
                transit_type, is_direction_in, result;

            direction = direction || 'in';
            is_direction_in = direction == 'in';

            if ( is_direction_in ) {
                transit_type = uijet.utils.returnOf(widget.options.transition, widget) || this.options.transition;
                result = Velocity.animate.apply(Velocity, [$el[0]].concat(_parseTransitionConfig(transit_type, widget)));
            }
            else {
                transit_type = uijet.utils.returnOf(widget.options.transition_reverse, widget) || ['reverse'];
                result = Velocity.animate.apply(Velocity, [$el[0]].concat(_parseTransitionConfig(transit_type, widget)));
            }

            return result;
        },
        /**
         * Animates an elements' properties.
         *
         * @method module:animation/velocity#animate
         * @param {HTMLElement[]} $elements - wrapped HTMLElement to animate or an array of Elements.
         * @param {string|Object} props - valid CSS text to set on the element's style, or a map of style properties.
         * @param {Object|number} [options] - config object or duration in milliseconds.
         * @param {string|Array} [easing] - easing function name or array of values for generating an easing function.
         * @returns {Promise} - promise object returned by the `Velocity.animate()` call.
         */
        animate             : function ($elements, props, options, easing) {
            return Velocity.animate(Array.prototype.slice.call($elements, 0), props, options, easing);
        }
    }, uijet);

    return Velocity;
}));
