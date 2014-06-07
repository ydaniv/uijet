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
     * @mixin Transitioned
     * @category Mixin
     * @extends BaseWidget
     */
    uijet.Mixin('Transitioned', {
        transitioned    : true,
        /**
         * Transitions the element into view
         * 
         * #### Signals:
         * 
         * * `pre_appear`: triggered at the beginning.
         * 
         * @memberOf Transitioned
         * @instance
         * @returns {Transitioned}
         */
        appear          : function () {
            var _super = this._super.bind(this);
            this.notify(true, 'pre_appear');
            // make sure we're on top
            (this.$wrapper || this.$element).addClass('current z_top');
            // make visible
            this._setCloak(false);
            //TODO: need to return this promise
            // start transitioning in
            this.transit('in').then(_super);
            return this;
        },
        /**
         * Transitions the element out of view or simply hides it
         * if `no_transitions` is truthy.
         * 
         * #### Signals:
         * 
         * * `pre_disappear`: triggered at the beginning, before the transition starts.
         * 
         * @memberOf Transitioned
         * @instance
         * @param {boolean} [no_transitions] - whether to hide the element without transitions.
         * @returns {Transitioned}
         */
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
                //TODO: need to return this promise
                // transit out
                this.transit('out').then(_success);
            }
            return this;
        },
        /**
         * Transitions the instance's top container, either into view
         * or out of it, depending on `direction`.
         * 
         * #### Signals:
         * 
         * * `post_transit`: triggered at end of transition. Takes the `direction` argument.
         * 
         * @memberOf Transitioned
         * @instance
         * @param {string} direction - `'in'` or `'out'`, depending of direction of transition.
         * @returns {Promise} - the transition promise.
         */
        transit         : function (direction) {
            // create a promise object
            this.transit_dfrd = uijet.Promise();
            this.transit_promise = this.transit_dfrd.promise();
            // do transition
            uijet.transit(this, direction, function () {
                // get this widget off the top
                (this.$wrapper || this.$element).removeClass('z_top');
                this.transit_dfrd.resolve();
                this.notify(true, 'post_transit', direction);
            });
            return this.transit_promise;
        },
        /**
         * Defers this method till when the transition ends.
         * 
         * @memberOf Transitioned
         * @instance
         * @returns {Transitioned}
         */
        sleepContained  : function () {
            this.transit_promise.then(this._super.bind(this));
            return this;
        }
    });
}));
