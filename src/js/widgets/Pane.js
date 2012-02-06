(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
                'uijet_dir/uijet',
                'uijet_dir/widgets/Base',
                'uijet_dir/mixins/Layered',
                'uijet_dir/mixins/Routed'
            ], function (uijet) {
                return factory(uijet);
            });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Widget('Pane', {
        options : {
            type_class  : 'uijet_pane'
        },
        wake            : function (context, by_route) {
            var args;
            // if invoked by route or user set the `force_wake` option to `true` then do full wake
            if ( by_route || this.options.force_wake ) {
                // enable waking logic to run
                this.awake = false;
                return this._super(context, by_route);
            }
            // if invoked by container widget and not a route then do a dry wake
            if ( this.awake ) return this._finally();
            // make sure we allow the user to check the state before we set this.container_context
            args = ['pre_wake'].concat(Array.prototype.slice.call(arguments));
            this.notify.apply(this, args);
            this.container_context = context;
            this.bind()
                .appear()
                .awake = true;
            this.notify('post_wake');
            return this._finally();
        }
    }, ['Layered', 'Routed']);
}));