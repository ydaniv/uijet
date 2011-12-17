(function (_window) {
    var uijet = _window.uijet,
        $ = _window.jQuery, // yes, we use jQuery
        Utils = uijet.Utils,
        Widget = function () {}, // constructor for BaseWidget
        CONFIG_ATTR = 'data-uijet-config',
        TYPE_ATTR = 'data-uijet-type',
        SUBSTITUTE_REGEX = /\{([^\s\}]+)\}/g;

    Utils.extend(Widget.prototype, {
        /*
         * @sign: init(options)
         * @return: widget
         *
         * Takes an ID of a widget and wakes all its contained widgets.
         * Takes an options context object as a second argument.
         */
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
                dfrds, args, success, _sequence;
            if ( this.awake && ! context ) return this; // no reason to continue
            args = ['pre_wake'].concat(Array.prototype.slice.call(arguments));
            this.notify.apply(this, args);
            this._setContext.apply(this, arguments);
            success = function () {
                if ( ! that.awake ) { // there was context to change but if we're set then bail out
                    that.render()
                        .bind()
                        .appear()
                        .awake = true;
                }
                that.notify('post_wake');
            };
            dfrds = this.wakeContained(context);
            _sequence = $.when.apply($, dfrds).fail(function () {
                that.notify('wake_failed', arguments);
                that.sleep();
            });
            this.options.sync ? _sequence.done(success) : success();
            return this;
        },
        wakeContained   : function (context) {
            return uijet.wakeContained(this.id, context); // returns an array of jQuery deferreds
        },
        sleep           : function () {
            if ( this.awake ) {
                this.notify('pre_sleep');
                this.unbind()
                    .disappear()
                    .sleepContained()
                    .awake = false;
                this.options.destroy_on_sleep && this.destroy();
                this.notify('post_sleep');
            }
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
            var dfrd_update, _success;
            if ( ! this.options.data_url ) return {};
            this.publish('pre_load', null, true);
            dfrd_update = $.Deferred();
            _success = function (response) {
                this.setData(response);
                if ( ! this.has_data ) {
                    dfrd_update.reject(response);
                } else {
                    this.notify('post_fetch_data', response);
                    dfrd_update.resolve();
                }
            };
             $.ajax({
                url     : this.getDataUrl(),
                type    : 'get',
                dataType: 'json',
                context : this
            }).done(_success)
              .fail(function (response) {
                var _abort_fail = this.notify.apply(this, ['update_error'].concat(Array.prototype.slice.call(arguments), _success.bind(this)));
                if ( _abort_fail !== false ) {
                    this.publish('update_error', response, true);
                    dfrd_update.reject(response);
                }
            });
            return dfrd_update.promise();
        },
        fetchTemplate   : function (refresh) {
            return {};
        },
        prepareElement  : function () {
            this.$element.addClass('uijet_widget ' + this.options.type_class);
            this.setStyle()
                .position();
            return this;
        },
        setStyle        : function () {
            var _style = this.options.style;
            if ( _style ) {
                this._wrap()
                    .$wrapper.css(_style);
            }
            return this;
        },
        generate        : function () {
            throw new Error('generate not implemented');
        },
        render          : function () {
            this.notify('pre_render');
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
                delete this.options.position; // no need to position twice
            }
            return this;
        },
        appear          : function () {
            this._setCloak(false);
            this.notify('post_appear');
            return this;
        },
        disappear       : function () {
            this._setCloak(true);
            this.notify('post_disappear');
            return this;
        },
        parse           : function () {
            var _options = this.$element.attr(CONFIG_ATTR);
            this.setOptions(this._parseOptions(_options));
            return this;
        },
        bind            : function () {
            var _dom_events, e, that = this, _bound;
            if ( _dom_events = this.options.dom_events ) {
                this._bound_dom_events = _bound = {};
                for ( e in _dom_events ) (function (name, handler) {
                    _bound[name] = handler.bind(that);
                    that.$element.bind(name, _bound[name]);
                })(e, _dom_events[e]);
            }
            this.bound = true;
            return this;
        },
        unbind          : function () {
            var _dom_events;
            if ( _dom_events = this.options.dom_events ) {
                this.$element.unbind(this._bound_dom_events);
            }
            this.bound = false;
            return this;
        },
        listen          : function (topic, handler) {
            this[topic] = handler;
            return this;
        },
        unlisten        : function (topic) {
            if ( this[topic] ) delete this[topic];
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
        runRoute        : function (route, is_silent) {
            uijet.runRoute(route, is_silent);
            return this;
        },
        select          : function (initial) {
            var $el;
            $el = typeof initial == 'function' ? initial.call(this) : this.$element.find(initial);
            $el.length && $el.click();
            return this;
        },
        setInnerRouter  : function () {
            var routing = this.options.routing, that = this;
            this.$element.delegate('a', 'click', function (e) {
                var $this = $(this);
                uijet.runRoute($this.attr('href'), typeof routing == 'undefined' ? true : typeof routing == 'function' ? ! routing.call(that, $this) : ! routing);
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
            var ops = this.options, _signals, _app_events;
            // listen to all signals set in options
            if ( _signals = ops.signals ) {
                for ( var n in _signals ) {
                    this.listen(n, _signals[n]);
                }
            }
            // subscribe to all app (custom) events set in options
             if ( _app_events = ops.app_events ) {
                for ( n in _app_events ) {
                    this.subscribe(n, _app_events[n]);
                }
            }
            // capture and delegate all anchor clicks to an inner routing mechanism
            if ( ~ 'function boolean undefined'.indexOf(typeof ops.routing) ) {
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
            return this.substitute(this.options.data_url, this.context);
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
        setData         : function (data) {
            var success = this.notify('process_data', data);
            if ( typeof success != 'undefined' && ! success ) {
                return this;
            }
            this.data = data;
            this.has_data = true;
            return this;
        },
        unshadow        : function (elements, do_unshadow) {
            uijet.is_iPad && $(elements).toggleClass('unshadow', typeof do_unshadow == 'boolean' ? do_unshadow : true);
            return this;
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
        _getSize            : function () {
            var children = this.$element.children(),
                total_width = 0,
                total_height = 0,
                l = children.length,
                size = { width: 0, height: 0 },
                child, rect;
            while ( child = children[--l] ) {
                rect = child.getClientRects();
                if ( rect && rect[0] ) {
                    total_width += rect[0].width;
                    total_height += rect[0].height;
                }
            }
            if ( this.options.horizontal ) {
                size.width = total_width;
                size.height = (rect && rect[0].height) || 0;
            } else {
                size.width = (rect && rect[0].height) || 0;
                size.height = total_height;
            }
            return size;
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
        _setContext     : function () {
            if ( arguments.length && typeof arguments[0] != 'undefined' ) {
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
            this.$element[0].setAttribute('style', ''); // needed to work around a Webkit bug
            this.$element[0].removeAttribute('style');
            this.has_content = false;
            return this;
        }
    });

    uijet.BaseWidget = Widget;
}(window));
