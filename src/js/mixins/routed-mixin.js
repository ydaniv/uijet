uijet.Mixin('Routed', {
    register        : function () {
        this.setRoute()
            .registerRoute();
        return this;
    },
    registerRoute   : function () {
        uijet.setRoute(this);
        return this;
    },
    checkState      : function () {
        var state = this.$element.attr('data-uijet-state');
        if ( state == 'current' ) {
            this.options.state = state;
        }
        return this;
    },
    setRoute        : function () {
        if ( ! this.options.route ) {
            this.options.route = '#/' + this.id + '/';
        }
        return this;
    },
    getRoute        : function () {
        return this.options.route;
    },
    run             : function (context) {
        this.publish('pre_load', null, true)
            .wake(context, true);
        return this;
    },
    appear          : function () {
        this._setCloak(false)
            .publish('post_load', null, true);
        return this;
    }
});