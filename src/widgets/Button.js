(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'uijet_dir/widgets/Base'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    uijet.Widget('Button', {
        options         : {
            type_class  : 'uijet_button',
            dont_wrap   : true
        },
        setInitOptions  : function () {
            this._super();
            this.bind(this.options.click_event || uijet.support.click_events.full, this.click);
            return this;
        },
        render          : function () {
            // virtually call `position` on each `wake`
            this.position()
                ._super();
            return this;
        },
        select          : function (initial) {
            if ( typeof initial == 'undefined' ) {
                this.$element.trigger(uijet.support.click_events.full);
            } else {
                this._super(initial);
            }
        },
        click           : function (e) {
            var routing = this.options.routing,
                // user to disable `clicked` event
                _publish = this.notify('pre_click', e);
            if ( _publish !== false ) {
                // if `data_url` option is set
                if ( this.options.data_url ) {
                    var url = this.getDataUrl().path;
                    // use the generated URL as a route to run
                    uijet.options.routed ?
                        this.runRoute(
                            url,
                            typeof routing == 'undefined' ? true : ! uijet.returnOf(routing, this, uijet.$(this))
                        ) :
                        // or simply publish it if not using a router
                        this.publish(url);
                }
                this.publish('clicked', {
                    context : this.context,
                    event   : e
                }).publish('app.clicked', {
                    id      : this.id,
                    event   : e
                }, true);
            }
            e.preventDefault();
            e.stopPropagation();
            return this;
        }
    });
}));