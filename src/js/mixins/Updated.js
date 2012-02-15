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
    uijet.Mixin('Updated', {
        updated : true,
        wake    : function (context) {
            var that = this, self_dfrd = $.Deferred(),
                dfrds, args, _callback, _fail, _success, _sequence;
            // notify the `pre_wake` signal with given `context`
            args = ['pre_wake'].concat(Array.prototype.slice.call(arguments));
            this.notify.apply(this, args);
            // set the `context`
            this._setContext.apply(this, arguments);
            // if this is not the updater then it receives data through `context`
            if ( ! this.options.data_url ) {
                // set `data`
                this.setData(this.context);
            }
            // starting waking up the kids
            dfrds = this.wakeContained(context);
            // store the callback to the successful flow
            _callback = function () {
                that.render()
                    .bind()
                    .appear()
                    .awake = true;
                that.notify('post_wake');
                self_dfrd.resolve();
                // make sure we tell the UI that the long wait comes to an end
                that.publish('post_load', null, true);
                that._finally();
            };
            // store the fail callback
            _fail = function () {
                that.notify('wake_failed', arguments);
                self_dfrd.reject();
                that.publish('post_load', null, true);
                that.sleep();
            };
            // store the success callback
            _success = function () {
                // if we have a `data_url` then `update` needs to be called
                if ( that.options.data_url ) {
                    // update the widget and continue flow
                    $.when( that.update() ).then(_callback, _fail);
                } else {
                    // just continue flow without updating
                    _callback();
                }
            };
            // prepare for failing (of the children) first
            _sequence = $.when.apply($, dfrds).fail(_fail);
            // if `sync` option is set to `true` then wake only after they're all awake
            this.options.sync ? _sequence.done(_success): _success();
            return self_dfrd.promise();
        }
    });
}));