uijet.Mixin('Floated', {
    options         : {
        app_events  : {
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
            .float();
        return this;
    },
    float           : function () {
        if ( ! this.floating ) {
            this._wrap().$wrapper.addClass('float');
            this.floating = true;
        }
        return this;
    },
    appear          : function () {
        // needed to be set programatically at the end to prevent Webkit from not setting the right height
        this.$element[0].style.overflow = 'hidden';
        this._super();
        return this;
    }
});