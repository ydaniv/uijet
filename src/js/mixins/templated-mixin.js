uijet.Mixin('Templated', {
    wake            : function (context) {
        var that = this, dfrds;
        this.notify.call(this, 'pre_wake', arguments);
        this._setContext.apply(this, arguments);
        this.dfrd = $.Deferred();
        dfrds = this.wakeContained(context);
        $.when.apply($, dfrds).then(function () {
            $.when( that.fetchTemplate(), that.update() ).then(function () {
                $.when ( that.render() ).then(function () {
                    that.bind()
                        .appear()
                        .awake = true;
                    that.notify('post_wake');
                    that.dfrd.resolve();
                });
            });
        });
        return this.dfrd.promise();
    },
    fetchTemplate   : function (refresh) {
        var that = this;
        if ( ! this.has_template || refresh ) {
            return $.ajax({
                url     : this.getTemplateUrl(),
                type    : 'get',
                success : function (response) {
                    that.template = response;
                    that.has_template = true;
                    that.notify('post_fetch_template', response);
                },
                error   : function (response) {
                    that.notify('fetchTemplate_error', response);
                }
            });
        }
        return {};
    },
    render              : function () {
        var _html = this.generate(),
            dfrd = $.Deferred(),
            loadables, that = this;
        this.notify('pre_render', _html);
        // remove the old rendered content
        this._clearRendered()
        // and append the new
            .$element.append(_html);
        loadables = this.deferLoadables();
        $.when.apply($, loadables).then(function () {
            that._wrap()
                .position();
            that._prepareHorizontal && that.options.horizontal && that._prepareHorizontal();
            that.notify('post_render');
            dfrd.resolve();
        });
        return dfrd.promise();
    },
    deferLoadables  : function () {
        var $img = this.$element.find('img'),
            _html = this.$element.html(),
            _inlines = _html.match(/url\(['"]?([\w\/:\.-]*)['"]?\)/),
            dfrd, src, _img, _dfrd, deferreds = [];
        if ( _inlines && _inlines[1] ) {
            _img = new Image();
            _dfrd = $.Deferred();
            _img.onload = function () {
                _dfrd.resolve();
            };
            _img.src = _inlines[1];
            deferreds.push(_dfrd.promise());
        }
        if ( $img.length ) {
            $img = $img.eq(0);
            if ( src = $img.attr('src') ) {
                dfrd = $.Deferred();
                $img.one('load', function () {
                    dfrd.resolve();
                });
                deferreds.push(dfrd.promise());
            }
        }
        return deferreds.length ? deferreds : [{}];
    },
    getTemplateUrl      : function () {
        return uijet.options.TEMPLATES_PATH + this.id + '.' + uijet.options.TEMPLATES_EXTENSION;
    }
});