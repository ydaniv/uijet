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

            this.options.disabled && this.disable();

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
                enabled = ! this.disabled,
                _publish;
            if ( enabled ) {
                // allow user to disable `clicked` event
                _publish = this.notify('pre_click', e);
                if ( _publish !== false ) {
                    //TODO: possible to add here a short cut for changing route if `route` option is on
                    //TODO: OR send an XHR request if `action` contains a URL
                    this.publish('clicked', {
                        context : this.getContext(),
                        event   : e
                    });
                    uijet.publish('app.clicked', e);
                }
            }
            e.preventDefault();
            e.stopPropagation();
            return this;
        },
        enable          : function () {
            this.disabled = false;
            this.$element.removeClass('disabled');
            return this;
        },
        disable         : function () {
            this.disabled = true;
            this.$element.addClass('disabled');
            return this;
        },
        activate        : function () {
            this.activated = true;
            this.$element.addClass('activated');
            return this;
        },
        deactivate      : function () {
            this.activated = false;
            this.$element.removeClass('activated');
            return this;
        }
    });
}));
