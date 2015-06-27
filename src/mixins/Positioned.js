(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet'
        ], function (uijet) {
            return factory(uijet);
        });
    }
    else {
        return factory(root.uijet);
    }
}(this, function (uijet) {
    'use strict';

    var OPPOSITES = { top: 'bottom', bottom: 'top', right: 'left', left: 'right' },
        POSITION_RE = /(fluid|top|bottom|right|left):?(\d+)?([^\d\|]+)?\|?(\d+)?([\D]+)?/,
        DIMENSIONS = { top: 'height', bottom: 'height', right: 'width', left: 'width' },
        positioned_widgets = {};

    /*
     * Positions a widget.
     * Takes into account the position and size set in sibling widgets' options,
     * to create a fluid UI.
     *
     * @param {Object} widget - the widget instance to position.
     * @param {string[]} [exclude] - list of style property names to exclude from setting.
     * @private
     */
    function _position (widget, exclude) {
        var container_id = widget.options.container,
            siblings = container_id ? positioned_widgets[container_id] || [] : [],
            position = { position: 'absolute', top: 0, bottom: 0, right: 0, left: 0 },
            processed = {},
            set_style = false,
            sibling, processed_position, p, len;
        // if there's anything to exclude
        if ( exclude && (len = exclude.length) ) {
            while ( len -- ) {
                // remove it from the style properties object
                delete position[exclude[len]];
                // and its opposite side (e.g. top-bottom, right-left)
                delete position[OPPOSITES[exclude[len]]];
            }
            // and remove the `position` property
            delete position.position;
        }
        else {
            exclude = '';
        }
        // loop over sibling widgets
        for ( len = siblings.length; len --; ) {
            sibling = siblings[len];
            // if it's this widget bail from this iteration
            if ( sibling === widget ) {
                continue;
            }
            // if we have a cached processed position on a sibling widget
            if ( processed_position = sibling.processed_position ) {
                set_style = true;
                // loop over position properties of the sibling
                for ( p in processed_position ) {
                    // if this property is not to be excluded
                    if ( ! ~ exclude.indexOf(p) ) {
                        // if we already processed this property
                        if ( p in processed ) {
                            // if it's using same units AND size of property of this widget is smaller then it's sibling's
                            if ( processed[p].unit === processed_position[p].unit &&
                                 processed[p].size < processed_position[p].size ) {
                                // set the size to the sibling's size
                                processed[p].size = processed_position[p].size;
                            }
                        }
                        else {
                            // otherwise, add it
                            processed[p] = processed_position[p];
                        }
                    }
                }
            }
        }
        // if anything to set
        if ( set_style ) {
            // grab all processed properties and create a map of style properties to values
            for ( p in processed ) {
                position[p] = processed[p].size + processed[p].unit;
            }
        }
        else {
            // if there's something to set then make sure it's set
            for ( p in position ) {
                if ( position.hasOwnProperty(p) ) {
                    set_style = true;
                    break;
                }
            }
        }
        // if we found something to set
        if ( set_style ) {
            // make sure we allow the widget to be fluid
            if ( 'left' in position || 'right' in position ) {
                position.width = 'auto';
            }
            if ( 'top' in position || 'bottom' in position ) {
                position.height = 'auto';
            }
            // set the styles
            widget.$wrapper.css(position);
        }
    }

    /**
     * Positioned mixin class.
     *
     * @mixin Positioned
     * @category Mixin
     * @extends BaseWidget
     */
    uijet.Mixin('Positioned', {
        positioned: true,
        /**
         * Registers the widget as a Positioned widget under its container widget.
         *
         * @methodOf Positioned
         * @returns {Positioned}
         */
        register  : function () {
            var res = this._super.apply(this, arguments),
                container;

            // register this instance as a positioned widget under its container widget
            if ( ! (container = positioned_widgets[this.options.container]) ) {
                positioned_widgets[this.options.container] = container = [];
            }
            container.push(this);

            return res;
        },
        /**
         * Removes this instance from the positioned widgets registry.
         *
         * @methodOf Positioned
         * @returns {Positioned}
         */
        unregister: function () {
            var res = this._super.apply(this, arguments),
                container = positioned_widgets[this.options.container];

            // remove this instance from positioned registry
            container.splice(container.indexOf(this), 1);

            return res;
        },
        /**
         * Positions the instance's element with respect to its
         * sibling widgets, according to value of `position`:
         *
         * * `'center'`: centers the widget.
         * * `'fluid'`: stretches the widget according to its container and siblings.
         * * other `string`: parses `position` and positions the widget according to its container and siblings.
         * * `Object`: passes `position` to `this.$wrapper.css()` as styling directives.
         *
         * This method will always attempt to {@link BaseWidget#_wrap} the instance's element.
         *
         * While positioning widgets using this method is handy for scaffolding
         * fluid UIs, performance wise it's best to ultimately do positioning
         * using CSS, unless dynamic run-time dimensions calculation is required.
         *
         * @methodOf Positioned
         * @param {string|Object} position - directives for positioning the instance's container element.
         * @returns {Positioned}
         */
        position  : function (position) {
            var processed, style, has_fluid_side, exclude = [];
            this._wrap();

            if ( typeof position == 'string' ) {
                if ( position == 'center' ) {
                    this._center();
                }
                else if ( position == 'fluid' ) {
                    _position(this);
                }
                else {
                    processed = {};
                    style = {};
                    position.split(' ').forEach(function (pair) {
                        var match = POSITION_RE.exec(pair),
                            side = match && match[1],
                            number, size_unit, margin_unit, has_margin;

                        if ( side ) {
                            if ( side === 'fluid' ) {
                                has_fluid_side = true;
                                return;
                            }
                            else {
                                exclude.push(side);
                                if ( match[3] == 'fluid' ) {
                                    has_fluid_side = true;
                                    return;
                                }
                            }

                            size_unit = match[3] || 'px';
                            margin_unit = match[5] || 'px';

                            // add padding or stick to side
                            number = + match[4];
                            // cache the numeric part
                            processed[side] = { size: number || 0 };
                            // add the units part for styling
                            number = number ?
                                     margin_unit ?
                                     number + margin_unit :
                                     number :
                                     0;
                            has_margin = ! ! number;
                            style[side] = number;

                            // process width/height if found
                            number = + match[2];
                            if ( number ) {
                                // if no margin or using the same unit (no need to calc)
                                //TODO: add option to use CSS calc
                                if ( ! has_margin || margin_unit === size_unit ) {
                                    // aggregate that dimension's length and add the unit
                                    processed[side].size = (processed[side].size + number);
                                    processed[side].unit = size_unit;
                                }
                                style[DIMENSIONS[side]] = number + (size_unit || 0);
                            }
                        }
                    });
                    // cache the parsed position for quick JIT positioning of fluid siblings
                    this.processed_position = processed;
                    style.position = 'absolute';
                    // continue to next if statement passing the parsed `style` object
                    position = style;
                    // use `_position()` to position according to this widget's siblings
                    has_fluid_side && _position(this, exclude);
                }
            }
            if ( uijet.utils.isObj(position) ) {
                this.$wrapper.css(position);
            }
            return this;
        }
    });

}));
