uijet.Mixin('Updated', {
    updated : true,
    wake    : function (context) {
        var that = this, self_dfrd = $.Deferred(),
            dfrds, args, _callback, _fail, _success, _sequence;
//        if ( this.awake ) return this; // no reason to continue
        args = ['pre_wake'].concat(Array.prototype.slice.call(arguments));
        this.notify.apply(this, args);
        this._setContext.apply(this, arguments);
        // if this is not the updater then it receives data through context
        if ( ! this.options.data_url ) {
            this.setData(this.context);
        }
        dfrds = this.wakeContained(context);
        _callback = function () {
            that.render()
                .bind()
                .appear()
                .awake = true;
            that.notify('post_wake');
            self_dfrd.resolve();
            that.publish('post_load', null, true);
            that._finally();
        };
        _fail = function () {
            that.notify('wake_failed', arguments);
            self_dfrd.reject();
            that.publish('post_load', null, true);
            that.sleep();
        };
        _success = function () {
            if ( that.options.data_url ) {
                $.when( that.update() ).then(_callback, _fail);
            } else {
                _callback();
            }
        };
        // prepare for failing first
        _sequence = $.when.apply($, dfrds).fail(_fail);
        this.options.sync ? _sequence.done(_success): _success();
        return self_dfrd.promise();
    }
});