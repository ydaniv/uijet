uijet.Widget('Pane', {
    options : {
        type_class  : 'uijet_pane'
    },
    wake            : function (context, by_route) {
        var args;
        // if invoked by container widget and not a route then do a dry wake
        if ( ! by_route ) {
            if ( this.awake ) return this;
            // make sure we allow the user to check the state before we set this.container_context
            args = ['pre_wake'].concat(Array.prototype.slice.call(arguments));
            this.notify.apply(this, args);
            this.container_context = context;
            this.bind()
                .appear()
                .awake = true;
            this.notify('post_wake');
            return {};
        }
        this.awake = false; // enable waking logic to run
        return this._super(context, by_route);
    }
}, ['Routed']);
