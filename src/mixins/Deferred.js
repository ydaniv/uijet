(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Deferred', {
        deferred: true,
        wake    : function (context) {
            var _super = this._super,
                promise;
            if ( this.options.promise ) {
                promise = uijet.Utils.returnOf(this.options.promise, this, context);
                return uijet.when(promise).then(function (value) {
                    _super.call(this, value);
                });
            }
            else {
                return _super.apply(this, arguments);
            }
        }
    });
}));