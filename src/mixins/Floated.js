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
            // if top position wasn't set
            if ( ! this._top_set ) {
                // get the `float_top` option value if it is set
                var top = uijet.utils.returnOf(this.options.float_top, this),
                    closing_str = isNaN(+top) ? '; }' : 'px; }',
                    bottom_style, rule;
                // check if `float_top` option was set
                if ( top ) {
                    // create a rule of positioning this floatee using the value of `float_top` option
                    rule = '#' + this._wrap().$wrapper.attr('id') + '.float.show { top: ' + top + closing_str;
                    // in Chrome when stylesheets are remote `document.styleSheets` may return `null`
                    if ( document.styleSheets ) {
                        // find the last stylesheet in the document
                        bottom_style = document.styleSheets[document.styleSheets.length - 1];
                        // insert this rule at that stylesheet's end
                        bottom_style.insertRule(rule, bottom_style.cssRules.length);
                    }
                    else {
                        // if `document.styleSheets` is `null`
                        bottom_style = document.createElement('style');
                        bottom_style.innerHTML = rule;
                        document.head.appendChild(bottom_style);
                    }
                }
            }
            // make sure we set the top position only once
            this._top_set = true;
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
        disappear      : function () {
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
        }
    });
}));
