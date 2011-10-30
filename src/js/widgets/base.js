(function (_window) {
    var uijet = _window.uijet,
        $ = _window.jQuery,
        Utils = _window._$,
        Widget = function () {},
        CONFIG_ATTR = 'data-uijet-config',
        TYPE_ATTR = 'data-uijet-type',
        SUBSTITUTE_REGEX = /\{([^\s\}]+)\}/g;

    Utils.extend(Widget.prototype, {
        init            : function (options) {
            this.setOptions(options)
                .setId()
                .setElement()
                ._setCloak(true)
                .prepareElement()
                .setInitOptions()
                .register()
                ._saveOriginal();
            this.notify('post_init');
            return this;
        },
        register        : function () {
            return this;
        },
        wake            : function (context) {
            var that = this,
                dfrds;
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
        },
        wakeContained   : function (context) {
            return uijet.wakeContained(this.id, context); // returns an array of jQuery deferreds
        },
        sleep           : function () {
            this.unbind();
            this.disappear()
                .sleepContained()
                .awake = false;
            this.options.destroy_on_sleep && this.destroy();
            return this;
        },
        sleepContained  : function () {
           uijet.sleepContained(this.id);
            return this;
        },
        destroy         : function () {
            this._clearRendered();
            return this;
        },
        update          : function () {
            var that = this;
            return $.ajax({
                url     : this.getDataUrl(),
                type    : 'get',
                dataType: 'json',
                success : function (response) {
                    that.has_data = true;
                    that.data = response;
                    that.notify('post_fetch_data', response);
                },
                error   : function (response) {
                    var _publish = that.notify('update_error', response);
                    _publish !== false && that.publish('update_error', response, true);
                }
            });
        },
        fetchTemplate   : function (refresh) {
            return {};
        },
        prepareElement  : function () {
            this.$element.addClass('uijet_widget ' + this.options.type_class);
            this.setSize();
            return this;
        },
        setSize         : function () {
            var _h;
            if ( _h = this.options.height ) {
                this._wrap()
                    .$wrapper[0].style.height = _h;
            }
            return this;
        },
        generate        : function () {
            throw new Error('generate not implemented');
        },
        render          : function () {
            this.notify('pre_render');
            this.position();
            return this;
        },
        position        : function () {
            var _pos = this.options.position;
            if ( _pos ) {
                this._wrap()
                    .$wrapper.addClass('fixed');
                if ( typeof _pos == 'string') {
                    this.$wrapper.addClass( _pos);
                    if ( _pos == 'center') {
                        this._center();
                    }
                } else if ( Utils.isObj(_pos) ) {
                    this.$wrapper.css(_pos);
                }
            }
            return this;
        },
        appear          : function () {
            this._setCloak(false);
            return this;
        },
        disappear       : function () {
            this._setCloak(true);
            return this;
        },
        parse           : function () {
            var _options = this.$element.attr(CONFIG_ATTR);
            this.setOptions(this._parseOptions(_options));
            return this;
        },
        bind            : function () {
            var _dom_events, e, that = this;
            if ( _dom_events = this.options.dom_events ) {
                for ( e in _dom_events ) (function (name, handler) {
                    that.$element.bind(name, handler.bind(that));
                })(e, _dom_events[e]);
            }
            return this;
        },
        unbind          : function () {
            return this;
        },
        listen          : function (topic, handler) {
            this[topic] = handler;
            return this;
        },
        notify          : function (topic) {
            if ( this[topic] ) {
                var args = Array.prototype.slice.call(arguments, 1);
                return this[topic].apply(this, args);
            }
        },
        subscribe       : function (topic, handler) {
            uijet.subscribe(topic, handler.bind(this));
            return this;
        },
        unsubscribe     : function (topic, handler) {
            uijet.unsubscribe(topic, handler);
            return this;
        },
        publish         : function (topic, data, global) {
            topic = global ? topic : this.id + '.' + topic;
            uijet.publish(topic, data);
            return this;
        },
        runRoute           : function (route, is_silent) {
            uijet.runRoute(route, is_silent);
            return this;
        },
        setInnerRouter  : function () {
            var that = this;
            this.$element.delegate('a', 'click', function (e) {
                uijet.runRoute($(this).attr('href'), true);
                return false;
            });
        },
        setOptions      : function (options) {
            if ( options.jquery ) {
                this.setElement(options)
                    .parse();
            } else {
                this.options = Utils.extend(true, {}, this.options, options);
            }
            return this;
        },
        setInitOptions  : function () {
            var _signals, _app_events;
            // listen to all signals set in options
            if ( _signals = this.options.signals ) {
                for ( var n in _signals ) {
                    this.listen(n, _signals[n]);
                }
            }
            // subscribe to all app (custom) events set in options
             if ( _app_events = this.options.app_events ) {
                for ( n in _app_events ) {
                    this.subscribe(n, _app_events[n]);
                }
            }
            // capture and delegate all anchor clicks to an inner routing mechanism
            if ( this.options.dont_route ) {
                this.setInnerRouter();
            }
            return this;
        },
        setId           : function () {
            this.id = this.options.id || (this.$element && this.$element[0].id) || this.setElement().$element[0].id;
            return this;
        },
        setElement      : function (element) {
            if ( ! this.$element ) {
                if ( element && element.jquery ) {
                    this.$element = element;
                } else {
                    this.$element = $(element || this.options.element);
                }
            }
            return this;
        },
        getDataUrl      : function () {
            return this.substitute(this.options.data_url + Akashi.AUTH, this.context);
        },
        getTemplateUrl  : function () {
            return this.substitute(this.options.template_url, {});
        },
        substitute      : function(template, obj) {
            var n = 0;
            return template.replace(SUBSTITUTE_REGEX, function(match, key){
                return Utils.isObj(obj) ? obj[key] : obj[n++];
            });
        },
        _wrap           : function () {
            if ( ! this.$wrapper ) {
                this.$wrapper = this.$element.wrap($('<div/>', {
                    'class' : 'uijet_wrapper ' + this.options.type_class + '_wrapper'
                })).parent();
            }
            return this;
        },
        _center         : function () {
            if ( ! this.$center_wrapper ) {
                this.$center_wrapper = this.$element.wrap($('<div/>', {
                    'class' : 'uijet_center_wrapper ' + this.options.type_class + '_center_wrapper'
                })).parent();
            }
            return this;
        },
        _parseOptions   : function (options) {
            var _options = {}, _pairs, l, op;
            if ( options && options.split ) {
                _pairs = options.split(',');
                l = _pairs.length;
                while ( l-- ) {
                    op = _pairs[l].split(':');
                    _options[op[0].trim()] = op[1].trim();
                }
            }
            return _options;
        },
        _setCloak       : function (cloak) {
            this.$element[0].style.visibility = cloak ? 'hidden' : 'visible';
            return this;
        },
        _setContext    : function () {
            if ( arguments.length ) {
                this.context = arguments;
            }
            return this;
        },
        _saveOriginal   : function () {
            // save a reference to the child nodes of the element prior to rendering
            ! this.$original_children && (this.$original_children = this.$element.children());
            return this;
        },
        _clearRendered  : function () {
            // remove all children that were added with .render()
            this.$element.children().not(this.$original_children).remove();
            return this;
        }
    });

    uijet.BaseWidget = Widget;
}(window));