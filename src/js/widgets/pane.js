uijet.Widget('Pane', {
    options : {
        type_class  : 'uijet_pane'
    },
    wake            : function (context, by_route) {
        var that = this, dfrds, args = ['pre_wake'].concat(Array.prototype.slice.call(arguments));
        this.notify.apply(this, args);
        // if invoked by container widget and not a route then do a dry wake
        if ( ! by_route ) {
            this.container_context = context;
            this.bind()
                .appear()
                .awake = true;
            this.notify('post_wake');
            return {};
        }
        if ( this.awake ) return this;
        this.notify('pre_wake');
        this._setContext.apply(this, arguments);
        dfrds = this.wakeContained(context);
        $.when.apply($, dfrds).then(function () {
            that.render()
                .bind()
                .appear()
                .awake = true;
            that.notify('post_wake');
        });
        return this;
    }
}, ['Routed']);