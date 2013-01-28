// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Updated', {
        updated : true,
        wake    : function (context) {
            var that = this, self_dfrd = uijet.Promise(),
                old_context = this.context, do_update,
                dfrds, _activate, _fail, _success, _sequence;
            // set the `context`
            this._setContext(context);
            // notify the `pre_wake` signal with `old_context`
            do_update = this.notify(true, 'pre_wake', old_context);
            // if this is not the updater then it receives data through `context`
            if ( ! this.options.data_url ) {
                // set `data`
                this.setData(this.context);
            }
            // starting waking up the kids
            dfrds = this.wakeContained(context);
            // store the callback to the successful flow
            _activate = function () {
                that.render()
                    .bindAll()
                    .appear()
                    .awake = true;
                that.notify(true, 'post_wake');
                self_dfrd.resolve();
                // make sure we tell the UI that the long wait comes to an end
                that.publish('post_load', null, true);
                that._finally();
            };
            // store the fail callback
            _fail = function () {
                that.notify(true, 'wake_failed', arguments);
                self_dfrd.reject();
                that.publish('post_load', null, true);
                that.sleep();
            };
            // store the success callback
            _success = function () {
                // if we have a `data_url` then `update` needs to be called
                if ( that.options.data_url && do_update !== false ) {
                    // update the widget and continue flow
                    uijet.when( that.update() ).then(_activate, _fail);
                } else {
                    // just continue flow without updating
                    _activate();
                }
            };
            _sequence = uijet.when.apply(uijet, dfrds);
            // if `sync` option is set to `true` then wake only after they're all awake
            _sequence.then(
                this.options.sync ? _success: _success(),
                _fail
            );
            return self_dfrd.promise();
        }
    });
}));