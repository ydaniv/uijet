//TODO: try converting this widget into a mixin
uijet.Widget('Overlay', {
    options     : {
        type_class  : 'uijet_overlay'
    },
    init        : function (options) {
        this._super(options).render();
        return this;
    },
    render      : function () {
        this._super();
        if ( this.options.darken ) {
            (this.$wrapper || this.$element).addClass('darken');
            delete this.options.darken; // no need to repeat this
        }
        return this;
    },
    appear      : function () {
        if ( this.$wrapper ) {
            this.$wrapper.addClass('top')[0].style.visibility = 'visible';
        } else {
            this.$element.addClass('top');
        }
        this._super();
        return this;
    },
    disappear   : function () {
        if ( this.$wrapper ) {
            this.$wrapper.removeClass('top')[0].style.visibility = 'hidden';
        } else {
            this.$element.removeClass('top');
        }
        this._super();
        return this;
    }
});
