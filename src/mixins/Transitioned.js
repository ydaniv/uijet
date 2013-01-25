(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Transitioned', {
        transitioned    : true,
        appear          : function () {
            var that = this, _super = this._super;
            this.notify(true, 'pre_appear');
            // make sure we're on top
            (this.$wrapper || this.$element).addClass('current z_top');
            // make visible
            this._setCloak(false);
            // start transitioning in
            uijet.when( this.transit('in') ).then(function () {
                _super.call(that);
            });
            return this;
        },
        disappear       : function (no_transitions) {
            var that = this,
                // caching super method for calling it later inside an async function
                _super = this._super,
                $el = this.$wrapper || this.$element,
                // store the animation callback
                _success = function () {
                    // make invisible
                    that._setCloak(true);
                    // clear classes related to active state
                    $el.removeClass('current reverse');
                    _super.call(that, no_transitions);
                };
            this.notify(true, 'pre_disappear');
            if ( no_transitions ) {
                // in case we want to hide the widget without animation just fire the callback
                _success();
            } else {
                // transit out
                uijet.when( this.transit('out') ).then(_success, function () {
                    // make sure we unbind the transition-end event handler
                    $el.off(uijet.support.transitionend);
                });
            }
            return this;
        },
        // ### widget.transit
        // @sign: transit([direction])  
        // @return: transit_promise
        // 
        // Performs the transition by hooking into `uijet.transit`.
        transit         : function (dir) {
            // create a promise object
            this.dfrd_transit = uijet.Promise();
            // do transition
            uijet.transit(this, dir, function () {
                // get this widget off the top
                (this.$wrapper || this.$element).removeClass('z_top');
                this.dfrd_transit.resolve();
                this.notify(true, 'post_transit', dir);
            });
            return this.dfrd_transit.promise();
        },
        unbind          : function () {
            // make sure we rollback the transit
            this.dfrd_transit && this.dfrd_transit.reject();
            this._super();
            return this;
        },
        sleepContained  : function () {
            var _super = this._super, that = this;
            uijet.when ( this.dfrd_transit.promise() ).then( function () {
                _super.call(that);
            });
            return this;
        }
    });
}));