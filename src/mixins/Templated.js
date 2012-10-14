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
                old_context = this.context, do_render,
                dfrd_wake, dfrds, _fail, _success, _activate, _sequence;
            // setting `context`
            this._setContext(context);
            // notify the `pre_wake` signal with the `old_context`
                do_render = this.notify('pre_wake', old_context);
            // create a new deferred wake promise object
            dfrd_wake = uijet.Promise();
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
            // final activation once content is ready
            _activate = function () {
                // bind DOM events
                that.bindAll()
                    .appear()
                    .awake = true;
                that.notify('post_wake');
                dfrd_wake.resolve();
                that._finally();
            };
            // in case of success
            if ( do_render === false ) {
                _success = _activate;
            } else {
                _success = function () {
                    // update the widget and get the template
                    uijet.when( that.update(), that.fetchTemplate() ).then(function () {
                        // render it
                        uijet.when ( that.render() ).then(_activate,
                        // fail render
                        _fail);
                    },
                    // fail update/fetch template
                    _fail);
                };
            }
            // in case any of the children failed, fail this
            _sequence = uijet.when.apply(uijet, dfrds).fail(_fail);
            // if `sync` option is `true` then call success after all children are awake
            this.options.sync ? _sequence.done(_success) : _success();
            return dfrd_wake ? dfrd_wake.promise() : {};
        },
        // ### widget.fetchTemplate
        // @sign: fetchTemplate([refresh])  
        // @return: promise OR this
        //
        // Gets the template from the server to be used for this widget via XHR.  
        // If `partials` option is set, an `Object` mapping partial name to its file name, loop over it and fetch all the partials needed.  
        // If those partials are stored deeper under the global templates' path use the `partials_dir` option
        // to specify it.  
        // If `refresh` is truthy then force the widget to fetch the template again.
        fetchTemplate   : function (refresh) {
            // if we don't have the template cached or was asked to refresh it
            if ( ! this.has_template || refresh ) {
                // create a promise for retrieving all templates
                var dfrd = uijet.Promise(),
                    // a stack for all template GET requests
                    requests = [],
                    // an error callback handler
                    failure = function (response) {
                        // tell the user we failed
                        this.notify.apply(this, ['fetchTemplate_error'].concat(uijet.Utils.toArray(arguments)));
                        // fail the whole fetching process
                        dfrd.reject();
                    },
                    partials = this.options.partials,
                    partials_dir = this.options.partials_dir || '',
                    that = this, p;
                // if asked to refresh then invalidate cache
                refresh && (this.has_template = false);
                // request the template
                requests.push(uijet.xhr(this.getTemplateUrl(), {
                    context : this
                }).done(function (response) {
                    // cache result
                    this.template = this.compile(response);
                }).fail(failure));
                // if we need to fetch partial templates
                if ( partials ) {
                    this.partials || (this.partials = {}); 
                    // loop over them
                    for ( p in partials ) (function (name, path) {
                        // build the path to each partial
                        var partial_path = uijet.options.TEMPLATES_PATH +
                                           partials_dir +
                                           path + "." +
                                           uijet.options.TEMPLATES_EXTENSION;
                        // request that partial
                        requests.push(uijet.xhr(partial_path, {
                            context : that
                        }).done(function (partial) {
                            // when done cache it
                            this.partials[name] = this.compile(partial, name);
                        }).fail(failure));
                    }(p, partials[p]));
                }
                // when all requests are resolved
                uijet.when.apply(uijet, requests).then(function () {
                    // set state to `has_tempalte`
                    that.has_template = true;
                    // tell the user we're done
                    that.notify('post_fetch_template');
                    // resolve the entire fetching promise
                    dfrd.resolve();
                });
                return dfrd.promise();
            }
            // like a fulfilled promise
            return this;
        },
        render              : function () {
            // generate the HTML
            var _html = this.generate(),
                dfrd = uijet.Promise(),
                loadables, that = this, _super = this._super,
                do_insert;
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
            uijet.when.apply(uijet, loadables).then(function () {
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
                dfrd = uijet.Promise();
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
                _dfrd = uijet.Promise();
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