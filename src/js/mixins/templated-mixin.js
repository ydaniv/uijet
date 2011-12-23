uijet.Mixin('Templated', {
    templated       : true,
    wake            : function (context) {
        var that = this, dfrds, _fail, _success, _sequence;
        this.notify.apply(this, ['pre_wake'].concat(Array.prototype.slice.call(arguments)));
        this._setContext.apply(this, arguments);
        this.dfrd = this.dfrd || $.Deferred();
        dfrds = this.wakeContained(context);
        _fail = function () {
            var retry = that.notify.apply(that, ['wake_failed'].concat(Array.prototype.slice.call(arguments)));
            if ( retry ) {
                that.wake();
            } else {
                that.dfrd.reject();
                delete that.dfrd;
                that.publish('post_load', null, true);
                that.sleep();
            }
        };
        _success = function () {
            $.when( that.update(), that.fetchTemplate() ).then(function () {
                $.when ( that.render() ).then(function () {
                    that.bind();
                    if ( that.options.initial ) { that.select(that.options.initial); }
                    that.appear()
                        .awake = true;
                    that.notify('post_wake');
                    that.dfrd.resolve();
                    delete that.dfrd;
                },/* fail render */ _fail);
            },/* fail update/fetch template */ _fail);
        };
        _sequence = $.when.apply($, dfrds).fail(_fail);
        this.options.sync ? _sequence.done(_success) : _success();
        return this.dfrd && this.dfrd.promise() || {};
    },
    fetchTemplate   : function (refresh) {
        var that = this;
        if ( ! this.has_template || refresh ) {
            return $.ajax({
                url     : this.getTemplateUrl(),
                type    : 'get',
                context : this
            }).done( function (response) {
                this.template = response;
                this.has_template = true;
                this.notify('post_fetch_template', response);
            }).fail( function (response) {
                this.notify.apply(this, ['fetchTemplate_error'].concat(Array.prototype.slice.call(arguments)));
            });
        }
        return {};
    },
    render              : function () {
        var _html = this.generate(),
            dfrd = $.Deferred(),
            loadables, that = this, _super = this._super;
        this.notify('pre_render', _html);
        // remove the old rendered content
        this._clearRendered();
        // and append the new
        if ( this.options.insert_before ) {
            $(_html).insertBefore(this.options.insert_before);
        } else {
            this.$element.append(_html);
        }
        this.has_content = true;
        loadables = this.options.defer_images ? this.deferLoadables() : [{}];
        $.when.apply($, loadables).then(function () {
//            _super.call(that);
            that._prepareScrolledSize && that._prepareScrolledSize();
            that.notify('post_render');
            that.publish('post_load', null, true);
            dfrd.resolve();
        });
        return dfrd.promise();
    },
    deferLoadables  : function () {
        var $img = this.$element.find('img'),
            _html = this.$element.html(),
            _inlines = _html.match(/url\(['"]?([\w\/:\.-]*)['"]?\)/),
            dfrd, src, _img, _dfrd, deferreds = [],
            _inlines_resolver = function () {
                _dfrd.resolve();
            },
            _element_resolver = function () {
                dfrd.resolve();
            };
        if ( _inlines && _inlines[1] ) {
            _img = new Image();
            _dfrd = $.Deferred();
            _img.src = _inlines[1];
            if ( _img.complete ) {
                _dfrd.resolve();
            } else {
                _img.onload = _inlines_resolver;
                _img.onerror = _inlines_resolver;
            }
            deferreds.push(_dfrd.promise());
        }
        if ( $img.length ) {
            $img = $img.eq(0);
            if ( src = $img.attr('src') ) {
                $img = $img[0];
                dfrd = $.Deferred();
                if ( $img.complete ) {
                    dfrd.resolve();
                } else {
                    $img.onload = _element_resolver;
                    $img.onerror = _element_resolver;
                }
                deferreds.push(dfrd.promise());
            }
        }
        return deferreds.length ? deferreds : [{}];
    },
    getTemplateUrl      : function () {
        return uijet.options.TEMPLATES_PATH + (this.options.template_name || this.id) + '.' + uijet.options.TEMPLATES_EXTENSION;
    }
});
