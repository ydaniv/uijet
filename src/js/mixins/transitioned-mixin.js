uijet.Mixin('Transitioned', {
    transitioned    : true,
    prepareElement  : function () {
        this.$element.addClass((this.options.animation_type || 'slide') + '_out');
        this._super();
        return this;
    },
    _wrap           : function () {
        var class_name = (this.options.animation_type || 'slide') + '_out';
        this._super();
        this.$wrapper.addClass(class_name);
        this.$element.removeClass(class_name);
        return this;
    },
    appear          : function () {
        var that = this, _super = this._super;
        this.notify('pre_appear');
        this.$element.addClass('current top');
        this._setCloak(false);
        $.when( this.transit('in') ).then(function () {
            _super.call(that);
        });
        return this;
    },
    disappear       : function () {
        var that = this,
            _super = this._super; // caching super method for it later inside an async function
        this.$element.removeAttr('style');
        $.when( this.transit('out') ).then(function () {
            that._setCloak(true);
            if ( that.$wrapper ) {
                that.$wrapper.removeClass('reverse');
                that.$element.removeClass('current');
            } else {
                that.$element.removeClass('current reverse');
            }
            _super.call(that);
        }, function () {
            (that.$wrapper || that.$element).unbind('transitionend webkitTransitionEnd');
        });
        return this;
    },
    transit         : function (dir) {
        this.dfrd_transit = $.Deferred();
        uijet.animate(this, dir, function () {
            this.$element.removeClass('top');
            this.dfrd_transit.resolve();
        });
        return this.dfrd_transit.promise();
    },
    unbind          : function () {
        this.dfrd_transit && this.dfrd_transit.reject();
        this._super();
        return this;
    }
});
