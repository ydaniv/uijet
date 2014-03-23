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
     * Floated mixin class.
     * 
     * @class Floated
     * @extends uijet.BaseWidget
     */
    uijet.Mixin('Floated', {
        floated         : true,
        options         : {
            // make sure `position()` is called by default
            position: true
        },
        /**
         * Initializes the floating state using by calling {@link Floated#setFloat}.
         * 
         * @memberOf Floated
         * @instance
         * @returns {Floated}
         */
        prepareElement  : function () {
            this._super()
                .setFloat();
            return this;
        },
        /**
         * Enables floating state.
         * Sets `this.floating` to `true`, and adds the `float` class
         * to the top container element.
         * Floated instances are {@link BaseWidget#_wrap}'ed by default.
         * 
         * @memberOf Floated
         * @instance
         * @returns {Floated}
         */
        setFloat        : function () {
            if ( ! this.floating ) {
                // wrap and set the `float` class
                this._wrap().$wrapper.addClass('float');
                // do this once
                this.floating = true;
            }
            return this;
        },
        /**
         * Positions the floating element.
         * 
         * Related options:
         * * `float_position`: an `Object` or `string` representing the position to use for the element.
         * 
         * @memberOf Floated
         * @instance
         * @returns {Floated}
         */
        position        : function () {
            var float_position;
            // if float_position position wasn't set
            if ( ! this._float_position_set ) {
                // get the `float_position` option value if it is set
                float_position = uijet.utils.returnOf(this.options.float_position, this);
                // check if `float_position` option was set
                this.floatPosition(float_position);
            }
            // make sure we set the top position only once
            this._float_position_set  = true;
            return this._super();
        },
        /**
         * Returns the elements back to its floating position.
         * 
         * @memberOf Floated
         * @instance
         * @returns {Floated}
         */
        appear          : function () {
            // needed to be set programmatically at the end to prevent Webkit from not setting the right height
            this.$element[0].style.overflow = 'hidden';
            // drop the element back to its place from the initial `top: -9000px` it's in
            this.$wrapper.addClass('show');
            this._super();
            return this;
        },
        /**
         * Throws the element away from the viewport,
         * by default this is up to outer space.
         * 
         * @memberOf Floated
         * @instance
         * @returns {Floated}
         */
        disappear       : function () {
            var that = this,
                hide_handler = function () {
                    // kick the element back to high heavens
                    that.$wrapper.removeClass('show');
                };
            this._super();
            if ( this.transitioned && this.dfrd_transit ) {
                this.dfrd_transit.always(hide_handler);
            } else {
                hide_handler();
            }
            return this;
        },
        /**
         * Parses a given `position` and sets it as a CSS rule
         * in the document.
         * 
         * @memberOf Floated
         * @instance
         * @param {string|Object} position - style attributes for positioning the floated element.
         * @returns {Floated}
         */
        floatPosition   : function (position) {
            if ( position ) {
                if ( uijet.utils.isObj(position) ) {
                    position =  this._parsePosition(position);
                }
                if ( typeof position == 'string' ) {
                    // create a CSS rule of positioning this floatee
                    this._setRule(position);
                }
            }
            return this;
        },
        /**
         * Inserts a parsed CSS text as a CSS rule to the document.
         * 
         * @memberOf Floated
         * @instance
         * @param {string} css_text - parsed CSS text for positioning the floated element.
         * @returns {Floated}
         * @private
         */
        _setRule        : function (css_text) {
            var selector = '#' + this._wrap().$wrapper.attr('id') + '.float.show',
                bottom_style;

            if ( this.float_rule_sheet ) {
                this._addRule(this.float_rule_sheet, selector, css_text);
            }
            else {
                // in Chrome when stylesheets are remote `document.styleSheets` may return `null`
                if ( document.styleSheets ) {
                    // find the last stylesheet in the document
                    bottom_style = document.styleSheets[document.styleSheets.length - 1];
                    // insert this rule at that stylesheet's end
                    this._addRule(bottom_style, selector, css_text)
                }
                else {
                    // if `document.styleSheets` is `null`
                    bottom_style = document.createElement('style');
                    bottom_style.innerHTML = css_text;
                    document.head.appendChild(bottom_style);
                }
                this.float_rule_sheet = bottom_style;
            }
            return this;
        },
        /**
         * Parses an `Object` containing style attributes into a `string`.
         * 
         * @memberOf Floated
         * @instance
         * @param {Object} position - a map of style attributes to values, either `number`s or `string`s.
         * @returns {string} - the parsed CSS text.
         * @private
         */
        _parsePosition  : function (position) {
            var css_text = '',
                key;
            for ( key in position ) {
                css_text += key + ':' + position[key] + (isNaN(+position[key]) ? ';' : 'px;');
            }
            return css_text;
        },
        /**
         * Inserts a style rule to a given style `sheet`.
         * 
         * @memberOf Floated
         * @instance
         * @param {CSSStyleSheet} sheet - a style sheet object.
         * @param {string} selector - a CSS query selector.
         * @param {string} css_text - style attributes.
         * @returns {Floated}
         * @private
         */
        //TODO: implement cleaning of old styles
        _addRule        : function (sheet, selector, css_text) {
            var index = (sheet.cssRules ? sheet.cssRules : sheet.rules).length;
            if ( sheet.insertRule ) {
                sheet.insertRule(selector + ' {' + css_text + '}', index);
            }
            else {
                sheet.addRule(selector, css_text);
            }
            return this;
        }
    });
}));
