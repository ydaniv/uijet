(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'uijet_dir/widgets/Base'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Button widget class.
     * 
     * @class Button
     * @extends uijet.BaseWidget
     */
    uijet.Widget('Button', {
        options         : {
            type_class  : 'uijet_button',
            dont_wrap   : true
        },
        /**
         * Binds the {@link Button#click} handler and handles initial state.
         * 
         * Related options:
         * * `disabled`: whether this button is initially disabled.
         * * `click_event`: space separated event types to use for binding the {@link Button#click}.
         * 
         * @memberOf Button
         * @instance
         * @returns {Button}
         */
        setInitOptions  : function () {
            this._super();

            this.options.disabled && this.disable();

            this.bind(this.options.click_event || uijet.support.click_events.full, this.click);
            return this;
        },
        /**
         * Positions the button using {@link BaseWidget#position}.
         * 
         * @memberOf Button
         * @instance
         * @returns {Button}
         */
        render          : function () {
            // virtually call `position` on each `wake`
            this.position()
                ._super();
            return this;
        },
        /**
         * Triggers selection on the element or an inner target.
         * 
         * @memberOf Button
         * @instance
         * @param {} [target] - query selector, HTMLElement, or a wrapped element to trigger selection on.
         */
        select          : function (target) {
            if ( typeof target == 'undefined' ) {
                this.$element.trigger(uijet.support.click_events.full);
            } else {
                this._super(target);
            }
        },
        /**
         * A handler for a selection event (e.g. `click`).
         * 
         * Signals:
         * * `pre_click`: if not disabled triggered before publishing events. If it returns `false`
         * events will not be published. 
         * 
         * App Events:
         * * `<this.id>.clicked`: the DOM event is translated into an app event, passed an `Object` with `context` and the
         * `event` object as properties.
         * * `app.clicked`: since default behavior of click event is disabled and propagation is stopped this is used for
         * delegating the event to the app's context. Sends the event object as an argument
         * 
         * @memberOf Button
         * @instance
         * @param {Object} [event] - the event object passed by the browser.
         * @returns {Button}
         */
        click           : function (event) {
            var enabled = ! this.disabled,
                _publish;
            if ( enabled ) {
                // allow user to disable `clicked` event
                _publish = this.notify('pre_click', event);
                if ( _publish !== false ) {
                    this.publish('clicked', {
                        context : this.getContext(),
                        event   : event
                    });
                    uijet.publish('app.clicked', event);
                }
            }
            event.preventDefault();
            event.stopPropagation();
            return this;
        },
        /**
         * Enables the button.
         * `this.disabled` will be set to `false` and the element's 
         * `disabled` class will be removed.
         * 
         * @memberOf Button
         * @instance
         * @returns {Button}
         */
        enable          : function () {
            this.disabled = false;
            this.$element.removeClass('disabled');
            return this;
        },
        /**
         * Disables the button.
         * `this.disabled` will be set to `true` and the element will be added
         * a `disabled` class.
         * 
         * @memberOf Button
         * @instance
         * @returns {Button}
         */
        disable         : function () {
            this.disabled = true;
            this.$element.addClass('disabled');
            return this;
        },
        /**
         * Puts the instance in active state, analogous to the `:active` CSS pseudo class.
         * This is useful for any arbitrary UI state that needs to be persisted.
         * `this.activated` will be set to `true` and the element will be added
         * a `activated` class.
         * 
         * @memberOf Button
         * @instance
         * @returns {Button}
         */
        activate        : function () {
            this.activated = true;
            this.$element.addClass('activated');
            return this;
        },
        /**
         * Turns active state off.
         * `this.activated` will be set to `false` and the element's
         * `activated` class will be removed.
         * 
         * @memberOf Button
         * @instance
         * @returns {Button}
         */
        deactivate      : function () {
            this.activated = false;
            this.$element.removeClass('activated');
            return this;
        }
    });
}));
