// ### AMD wrapper
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
        options         : {
            app_events  : {
                // by default try listening to any interaction that requires hiding floated widgets
                clicked : function (e) {
                    if ( this.awake ) {
                        this.sleep();
                    }
                }
            }
        },
        floated         : true,
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
                this.dfrd_transit.then(hide_handler, hide_handler);
            } else {
                hide_handler();
            }
            return this;
        }
    });
}));