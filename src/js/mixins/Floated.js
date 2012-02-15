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
            this._super();
            return this;
        }
    });
}));