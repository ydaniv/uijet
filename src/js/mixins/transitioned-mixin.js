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
    //TODO: improve this method
    transit     : function () {
        var that = this,
            animation_type = this.options.animation_type,
            dfrd_transit = $.Deferred(),
            animation;
        if ( false ) { //TODO: implement the reversing mechanism
            animation_type = 'reverse';
            this.$element.addClass('reverse');
        }
        switch (animation_type) {
            case 'reverse':
                animation = {left: '0%'};
                break;
            default:
                animation = {right: '0%'};
                break;
        }
        // TODO: replace with CSS transitions
        that.$element.animate(animation, function () {
            that.$element.removeClass('top');
            dfrd_transit.resolve();
        });
        return dfrd_transit.promise();
    }
});