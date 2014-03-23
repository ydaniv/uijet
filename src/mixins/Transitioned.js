(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Transitioned mixin class.
     * 
     * @class Transitioned
     * @extends uijet.BaseWidget
     */
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
            this.transit('in').then(function () {
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
                this.transit('out').then(_success);
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
            this.transit_dfrd = uijet.Promise();
            this.transit_promise = this.transit_dfrd.promise();
            // do transition
            uijet.transit(this, dir, function () {
                // get this widget off the top
                (this.$wrapper || this.$element).removeClass('z_top');
                this.transit_dfrd.resolve();
                this.notify(true, 'post_transit', dir);
            });
            return this.transit_promise;
        },
        sleepContained  : function () {
            var _super = this._super, that = this;
            this.transit_promise.then(function () {
                _super.call(that);
            });
            return this;
        }
    });
}));
