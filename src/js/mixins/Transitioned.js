// ### AMD wrapper
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
            this.notify('pre_prepareelement');
            // initialy set the __animation_type_out__ `class`
            this.$element.addClass((this.options.animation_type || uijet.options.animation_type) + '_out');
            this._super();
            return this;
        },
        _wrap           : function () {
            // cache the __animation_type_out__ `class`
            var class_name = (this.options.animation_type || uijet.options.animation_type) + '_out';
            // do wrapping
            this._super();
            // add this class to the `$wrapper`
            this.$wrapper.addClass(class_name);
            // and remove it from the `$element`
            this.$element.removeClass(class_name);
            return this;
        },
        appear          : function () {
            var that = this, _super = this._super;
            this.notify('pre_appear');
            // make sure we're on top
            (this.$wrapper || this.$element).addClass('current z_top');
            // make visible
            this._setCloak(false);
            // start transitioning in
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
                // store the animation callback
                _success = function () {
                    // make invisible
                    that._setCloak(true);
                    // clear classes related to active state
                    $el.removeClass('current reverse');
                    _super.call(that, no_transitions);
                };
            this.notify('pre_disappear');
            if ( no_transitions ) {
                // in case we want to hide the widget without animation just fire the callback
                _success()
            } else {
                // animate out
                $.when( this.transit('out') ).then(_success, function () {
                    // make sure we unbind the transition-end event handler
                    $el.unbind('transitionend webkitTransitionEnd');
                });
            }
            return this;
        },
        // ### widget.transit
        // @sign: transit([direction])  
        // @return: transit_promise
        // 
        // Performs the transition by hooking into `uijet.animate`.
        transit         : function (dir) {
            // create a promise object
            this.dfrd_transit = $.Deferred();
            // animate
            uijet.animate(this, dir, function () {
                // get this widget off the top
                (this.$wrapper || this.$element).removeClass('z_top');
                this.dfrd_transit.resolve();
                this.notify('post_transit');
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
            $.when ( this.dfrd_transit.promise() ).then( function () {
                _super.call(that);
            });
            return this;
        }
    });
}));