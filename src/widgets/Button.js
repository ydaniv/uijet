(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'uijet_dir/widgets/Base'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    var dom_events = {};
    // by default bind this click/tap event handler
    dom_events[uijet.support.click_events.full] = function (e) {
        // publish the `pre_click` signal and allow user to disable `clicked` event
        var _publish = this.notify('pre_click', e);
        if ( _publish !== false ) {
            // publish `clicked` event
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
    };

    uijet.Widget('Button', {
        options         : {
            type_class  : 'uijet_button',
            dont_wrap   : true,
            dom_events  : dom_events
        },
        setInitOptions  : function () {
            var that = this, routing = that.options.routing;
            this._super();
            // if `data_url` option is set
            if ( this.options.data_url ) {
                // bind another click handler 
                this.$element.on(uijet.support.click_events.full, function () {
                    // get `data_url` and run it as route, using `routing` option to determine whether it's inner
                    that.runRoute(
                        that.getDataUrl().path,
                        typeof routing == 'undefined' ? true : ! uijet.returnOf(routing, that, uijet.$(this))
                    );
                });
            }
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
        }
    });
}));