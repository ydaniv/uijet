uijet.Widget('View', {
    options : {
        type_class  : 'uijet_view'
    },
    register: function () {
        this.setRoute().registerRoute();
        uijet.View(this.id, this);
        this.checkState();
        return this;
    },
    appear  : function () {
        var that = this;
        this.notify('pre_appear');
        this.$element.addClass('current top');
        this._setCloak(false);
        $.when( this.transit() ).then(function () {
            uijet.switchView(that);
            that.publish('post_load', null, true);
        });
        return this;
    }
}, ['Routed', 'Transitioned']);