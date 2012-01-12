uijet.Widget('View', {
    options : {
        type_class  : 'uijet_view'
    },
    register: function () {
        this._super();
        uijet.View(this.id, this);
        this.checkState();
        return this;
    },
    disappear       : function (no_transitions) {
        this.$element.removeAttr('style');
        this._setCloak(true);
        this.$element.removeClass((this.options.animation_type || 'slide') + '_in')
                     .removeClass('current z_top reverse');
        this.notify('post_disappear');
        return this;
    },
    appear  : function () {
        var that = this;
        this.notify('pre_appear');
        this.$element.addClass('current z_top');
        this._setCloak(false);
        $.when( this.transit('in') ).then(function () {
            uijet.switchView(that);
            that.publish('post_load', null, true)
                .notify('post_appear');
        });
        return this;
    }
}, ['Layered', 'Routed', 'Transitioned', 'Updated']);