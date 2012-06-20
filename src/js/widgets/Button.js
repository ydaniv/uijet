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
            dont_wrap   : true,
            dom_events  : {
                // by default bind this click event handler
                click   : function (e) {
                    // publish the `pre_click` signal and allow user to disable `clicked` event
                    var _publish = this.notify(true, 'pre_click', e);
                    if ( _publish !== false ) {
                        // publish `clicked` event
                        this.publish('clicked', this.context)
                            .publish('app.clicked', this.id, true);
                    }
                    return false;
                }
            }
        },
        setInitOptions  : function () {
            var that = this, routing = that.options.routing;
            this._super();
            // if `data_url` option is set
            if ( this.options.data_url ) {
                // bind another click handler 
                this.$element.click(function () {
                    // get `data_url` and run it as route, using `routing` option to determine whether it's inner
                    that.runRoute(that.getDataUrl(), typeof routing == 'undefined' ?
                                                        true :
                                                        typeof routing == 'function' ?
                                                            ! routing.call(that, $(this)) :
                                                            ! routing);
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
                this.$element.click();
            } else {
                this._super(initial);
            }
        },
        // override the base method if it's overridden by mixins
        getDataUrl      : function () {
            return this.substitute(uijet.Utils.returnOf(this.options.data_url, this), this.context);
        }
    });
}));