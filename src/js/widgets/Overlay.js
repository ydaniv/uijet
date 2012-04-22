//TODO: try converting this widget into a mixin
// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'uijet_dir/widgets/Base', 'uijet_dir/mixins/Layered'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Widget('Overlay', {
        options     : {
            type_class  : 'uijet_overlay'
        },
        init        : function (options) {
            // complete `render` on `init`
            this._super(options).render()
                ._finally();
            return this;
        },
        render      : function () {
            this._super();
            if ( this.$wrapper ) {
                this.$wrapper[0].style.visibility = 'hidden';
            }
            // if `darken` option is set and `true`
            if ( this.options.darken ) {
                // add the `darken` class to the top level element
                (this.$wrapper || this.$element).addClass('darken');
                // no need to repeat this
                delete this.options.darken;
            }
            return this;
        },
        appear      : function () {
            // make this top level by adding `z_top` class
            if ( this.$wrapper ) {
                this.$wrapper.addClass('z_top')[0].style.visibility = 'visible';
            } else {
                this.$element.addClass('z_top');
            }
            this._super();
            return this;
        },
        disappear   : function (no_transitions) {
            // remove `z_top` class
            if ( this.$wrapper ) {
                this.$wrapper.removeClass('z_top')[0].style.visibility = 'hidden';
            } else {
                this.$element.removeClass('z_top');
            }
            this._super(no_transitions);
            return this;
        }
    }, ['Layered']);
}));