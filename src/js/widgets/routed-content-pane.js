uijet.Widget('RoutedContentPane', {
    options : {
        type_class  : 'uijet_routed_content_pane'
    },
    wake    : function (context, by_route) {
        var that = this, dfrd, dfrds, args, _success, _sequence;
        // if invoked by container widget and not a route then do a dry wake
        if ( ! by_route ) {
            if ( this.awake && ! context ) return this._finally(); // no reason to continue
            // make sure we allow the user to check the state before we set this.container_context
            args = ['pre_wake'].concat(Array.prototype.slice.call(arguments));
            this.notify.apply(this, args);
            // it's not a specific call for this pane so it's the container's context
            this.container_context = context;
            // if there's content then just show what we've got
            if ( this.has_content ) {
                dfrd = $.Deferred();
                // make the contained appear but don't change their context
                dfrds = this.wakeContained();
                _success = function () {
                    if ( ! that.awake ) { // there was context to change but if we're set then bail out
                        that.bind()
                            .appear()
                            .awake = true;
                        that.notify('post_wake');
                        dfrd.resolve();
                        that._finally();
                    }
                };
                _sequence = $.when.apply($, dfrds).fail(function () {
                    that.notify('wake_failed', arguments);
                    dfrd.reject();
                    that.sleep();
                });
                this.options.sync ? _sequence.done(_success) : _success();
                return dfrd.promise();
            }
            return this._finally();
        }
        return this._super(context, by_route);
    }
}, ['Layered', 'Routed', 'Templated']);