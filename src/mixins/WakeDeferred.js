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
    uijet.Mixin('WakeDeferred', {
        wake_deferred   : true,
        wake            : function (context) {
            var promise;
            if ( this.options.wake_promise ) {
                promise = uijet.Utils.returnOf(this.options.wake_promise, this, context);
                if ( promise.state() !== 'resolved' ) {
                    this.defer(promise);
                    return this.options.bubble_wake_promise ? promise : this;
                }
            }
            return this._super.apply(this, arguments);
        }
    });
}));