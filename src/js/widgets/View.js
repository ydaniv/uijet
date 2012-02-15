// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'jquery',
            'uijet_dir/widgets/Base',
            'uijet_dir/mixins/Layered',
            'uijet_dir/mixins/Routed',
            'uijet_dir/mixins/Transitioned',
            'uijet_dir/mixins/Updated'
        ], function (uijet, $) {
            return factory(uijet, $);
        });
    } else {
        factory(uijet, jQuery);
    }
}(function (uijet, $) {
    uijet.Widget('View', {
        options : {
            type_class  : 'uijet_view'
        },
        register: function () {
            this._super();
            // register this view using `uijet.View`
            uijet.View(this.id, this);
            // check if this is the current screen
            this.checkState();
            return this;
        },
        disappear       : function (no_transitions) {
            // clear the `style` attribute
            this.$element.removeAttr('style');
            this._setCloak(true);
            // clear animation related class without animating
            this.$element.removeClass((this.options.animation_type || uijet.options.animation_type) +
                                        '_in current z_top reverse');
            this.notify('post_disappear');
            return this;
        },
        appear  : function () {
            var that = this;
            this.notify('pre_appear');
            // put the `$element` on top
            this.$element.addClass('current z_top');
            // hide it
            this._setCloak(false);
            // perform the transition into view
            $.when( this.transit('in') ).then(function () {
                // switch current view in sandbox
                uijet.switchView(that);
                // publish
                that.publish('post_load', null, true)
                    .notify('post_appear');
            });
            return this;
        }
    }, ['Layered', 'Routed', 'Transitioned', 'Updated']);
}));