(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Floated', {
        floated         : true,
        options         : {
            // make sure `position()` is called by default
            position: true
        },
        prepareElement  : function () {
            this._super()
                .setFloat();
            return this;
        },
        // ### widget.setFloat
        // @sign: setFloat()  
        // @return: this
        //
        // Makes sure the element is floating, meaning, wraps it and adds the `float` class to `$wrapper`.
        setFloat        : function () {
            if ( ! this.floating ) {
                // wrap and set the `float` class
                this._wrap().$wrapper.addClass('float');
                // do this once
                this.floating = true;
            }
            return this;
        },
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
        appear          : function () {
            // needed to be set programmatically at the end to prevent Webkit from not setting the right height
            this.$element[0].style.overflow = 'hidden';
            // drop the element back to its place from the initial `top: -9000px` it's in
            this.$wrapper.addClass('show');
            this._super();
            return this;
        },
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
        floatPosition   : function (position) {
            if ( position ) {
                if ( uijet.utils.isObj(position) ) {
                    position =  this._parsePosition(position);
                }
                if ( typeof position == 'string' ) {
                    // create a CSS rule of positioning this floatee
                    this.setRule(position);
                }
            }
            return this;
        },
        setRule         : function (css_text) {
            var selector = '#' + this._wrap().$wrapper.attr('id') + '.float.show',
                index = 0,
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
        _parsePosition  : function (position) {
            var css_text = '',
                key;
            for ( key in position ) {
                css_text += key + ':' + position[key] + (isNaN(+position[key]) ? ';' : 'px;');
            }
            return css_text;
        },
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
