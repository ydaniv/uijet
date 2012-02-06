(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery'], function (uijet, $) {
            return factory(uijet, $);
        });
    } else {
        factory(uijet, jQuery);
    }
}(function (uijet, $) {
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
            (this.$wrapper || this.$element).addClass('current z_top');
            this._setCloak(false);
            $.when( this.transit('in') ).then(function () {
                _super.call(that);
            });
            return this;
        },
        disappear       : function (no_transitions) {
            var that = this,
                // caching super method for calling it later inside an async function
                _super = this._super,
                $el = this.$wrapper || this.$element,
                _success = function () {
                    that._setCloak(true);
                    $el.removeClass('current reverse');
                    _super.call(that, no_transitions);
                };
            //TODO: this is probably not needed, check for removal
            /*  this.$element.removeAttr('style');*/
            if ( no_transitions ) {
                _success()
            } else {
                $.when( this.transit('out') ).then(_success, function () {
                    $el.unbind('transitionend webkitTransitionEnd');
                });
            }
            return this;
        },
        transit         : function (dir) {
            this.dfrd_transit = $.Deferred();
            uijet.animate(this, dir, function () {
                (this.$wrapper || this.$element).removeClass('z_top');
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
}));