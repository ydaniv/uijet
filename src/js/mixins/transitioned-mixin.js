uijet.Mixin('Transitioned', {
    appear      : function () {
        var that = this;
        this.notify('pre_appear');
        this.$element.addClass('current top');
        this._setCloak(false);
        $.when( this.transit() ).then(function () {
            that.publish('post_load', null, true);
        });
        return this;
    },
    disappear   : function () {
        this.$element.removeAttr('style');
        this._setCloak(true);
        this.$element.removeClass('current reverse');
        this.notify('post_disappear');
        return this;
    },
    transit     : function () {
        var dfrd_transit = $.Deferred();
        uijet.animate(this, function () {
            this.$element.removeClass('top');
            dfrd_transit.resolve();
        });
        return dfrd_transit.promise();
    }
});