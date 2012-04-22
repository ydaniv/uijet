// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'jquery'], function (uijet, $) {
            return factory(uijet, $);
        });
    } else {
        factory(uijet, jQuery);
    }
}(function (uijet, $) {
    uijet.Mixin('Templated', {
        templated       : true,
        wake            : function (context) {
            var that = this,
                dfrd_wake, dfrds, _fail, _success, _sequence;
            // notify the `pre_wake` signal
            this.notify('pre_wake', context);
            // setting `context`
            this._setContext(context);
            // create a new deferred wake promise object
            dfrd_wake = $.Deferred();
            // wake up the kids
            dfrds = this.wakeContained(context);
            // in case of failure
            _fail = function () {
                // notify failure signal
                var retry = that.notify.apply(that, ['wake_failed'].concat(Array.prototype.slice.call(arguments)));
                if ( retry ) {
                    // if user asked to retry the wake again
                    that.wake();
                } else {
                    dfrd_wake.reject();
                    // inform UI the process is done
                    that.publish('post_load', null, true);
                    that.sleep();
                }
            };
            // in case of success
            _success = function () {
                // update the widget and get the template
                $.when( that.update(), that.fetchTemplate() ).then(function () {
                    // render it
                    $.when ( that.render() ).then(function () {
                        // bind DOM events
                        that.bind()
                            .appear()
                            .awake = true;
                        that.notify('post_wake');
                        dfrd_wake.resolve();
                        that._finally();
                    },
                    // fail render
                    _fail);
                },
                // fail update/fetch template
                _fail);
            };
            // in case any of the children failed, fail this
            _sequence = $.when.apply($, dfrds).fail(_fail);
            // if `sync` option is `true` then call success after all children are awake
            this.options.sync ? _sequence.done(_success) : _success();
            return dfrd_wake ? dfrd_wake.promise() : {};
        },
        // ### widget.fetchTemplate
        // @sign: fetchTemplate([refresh])  
        // @return: XHR_promise OR {}
        //
        // Gets the template from the server to be used for this widget via XHR.  
        // If `refresh` is truthy then force the widget to fetch the template again.
        fetchTemplate   : function (refresh) {
            // if we don't have the template cached or was asked to refresh it
            if ( ! this.has_template || refresh ) {
                // if asked to refresh then invalidate cache
                refresh && (this.has_template = false);
                // return the promise from the XHR call
                return $.ajax({
                    url     : this.getTemplateUrl(),
                    type    : 'get',
                    context : this
                }).done( function (response) {
                    // cache result
                    this.template = response;
                    this.has_template = true;
                    // tell the user we're done
                    this.notify('post_fetch_template', response);
                }).fail( function (response) {
                    // tell the user we failed
                    this.notify.apply(this, ['fetchTemplate_error'].concat(Array.prototype.slice.call(arguments)));
                });
            }
            // like a fulfilled promise
            return {};
        },
        render              : function () {
            // generate the HTML
            var _html = this.generate(),
                dfrd = $.Deferred(),
                loadables, that = this, _super = this._super,
                do_insert = true;
            // notify `pre_render` with the generate HTML
            this.notify('pre_render', _html);
            // remove the old rendered content
            this._clearRendered();
            // and append the new  
            // allow the user to specify his own method of inserting the HTML
            // if this signal returns `false` we'll skip the lines below
            do_insert = this.notify('pre_html_insert', _html);
            if ( do_insert !== false ) {
                // if `insert_before` option is set it's used as a selector or element to indicate where to insert the
                // generated HTML before.
                if ( this.options.insert_before ) {
                    $(_html).insertBefore(this.options.insert_before);
                } else {
                    // just append the HTML at the end
                    this.$element.append(_html);
                }
            }
            this.has_content = true;
            // if `defer_images` option is `> 0` then defer the flow till after the loading of images
            loadables = this.options.defer_images ? this.deferLoadables() : [{}];
            // after all was loaded or if ignored deferring it
            $.when.apply($, loadables).then(function () {
                _super.call(that);
                // if this widget is `scrolled` then prepare its `$element`'s size
                that.scrolled && that._prepareScrolledSize();
                that.notify('post_render');
                uijet.publish('post_load');
                dfrd.resolve();
            });
            return dfrd.promise();
        },
        // ### widget.deferLoadables
        // @sign: deferLoadables()  
        // @return: promises_array OR [{}]
        //
        // Deferrs the flow to continue after all images have been loaded.  
        //TODO: Make this work over either all images or as defined by `this.options.defer_images`  
        //TODO: consider moving this to base to defer also non-templated loadables
        deferLoadables  : function () {
            // find all images
            var $imgs = this.$element.find('img'),
                // get innerHTML of `$element`
                _html = this.$element[0].innerHTML,
                // match all URLs of images in the HTML
                _inlines = _html.match(/url\(['"]?([\w\/:\.-]*)['"]?\)/),
                src, _img, dfrd, deferreds = [],
                _inlines_resolver = function () {
                    _img = null;
                    dfrd.resolve();
                };
            if ( _inlines && _inlines[1] ) {
                _img = new Image();
                dfrd = $.Deferred();
                _img.src = _inlines[1];
                if ( _img.complete ) {
                    _img = null;
                    dfrd.resolve();
                } else {
                    _img.onload = _inlines_resolver;
                    _img.onerror = _inlines_resolver;
                }
                deferreds.push(dfrd.promise());
            }
            $imgs.each(function (i, img) {
                var _dfrd, _resolver;
                _dfrd = $.Deferred();
                _resolver = _dfrd.resolve.bind(_dfrd);
                if ( img.complete ) {
                    _resolver();
                } else {
                    img.onload = _resolver;
                    img.onerror = _resolver;
                }
                deferreds.push(_dfrd.promise());
            });
            return deferreds.length ? deferreds : [{}];
        },
        // ### widget.getTemplateUrl
        // @sign: getTemplateUrl()  
        // @return: template_url
        //
        // Gets the URL used by the widget to fetch its template.  
        // Uses uijet's `TEMPLATE_PATH` option as a prefix, followed by either `template_name` option or the `id`
        // property, with uijet's `TEMPLATES_EXTENSION` option as the extension suffix.
        getTemplateUrl      : function () {
            return uijet.options.TEMPLATES_PATH + (this.options.template_name || this.id) + '.' + uijet.options.TEMPLATES_EXTENSION;
        }
    });
}));