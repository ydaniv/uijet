(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    if ( ! uijet.BaseWidget.prototype.compile ) {
        uijet.use({
            /**
             * Stub for template compilation, to be implemented by the engine module.
             * 
             * @param {string} template - a template string.
             * @returns {string} - the `template` argument.
             */
            compile: function (template) {
                return template;
            }
        }, uijet.BaseWidget.prototype);
    }

    /**
     * Templated mixin class.
     * 
     * @class Templated
     * @extends uijet.BaseWidget
     */
    uijet.Mixin('Templated', {
        templated       : true,
        /**
         * Starts loading the template.
         * 
         * Related options:
         * * `dont_auto_fetch_template`: if `true` will not load the template file on `init()`.
         * 
         * @memberOf Templated
         * @instance
         * @returns {Templated}
         */
        init            : function () {
            this._super.apply(this, arguments);
            if ( ! this.options.dont_auto_fetch_template ) {
                this.fetchTemplate();
            }
            return this;
        },
        // ### widget.fetchTemplate
        // @sign: fetchTemplate()  
        // @return: promise OR this
        //
        // Gets the template from the server to be used for this widget via XHR.  
        // If `partials` option is set, an `Object` mapping partial name to its file name, loop over it and fetch all the partials needed.  
        // If those partials are stored deeper under the global templates' path use the `partials_dir` option
        // to specify it.  
        fetchTemplate   : function () {
            // if we don't have the template cached
            if ( ! this.has_template ) {
                if ( this._template_promise ) return this._template_promise;
                // create a promise for retrieving all templates
                var dfrd = uijet.Promise(), promise = dfrd.promise(),
                    that = this,
                    // a stack for all template GET requests
                    requests = [],
                    // an error callback handler
                    failure = function (response) {
                        // tell the user we failed
                        that.notify.apply(that, [true, 'fetchTemplate_error'].concat(uijet.utils.toArray(arguments)));
                        // fail the whole fetching process
                        dfrd.reject();
                    },
                    clear_promise = function () {
                        delete that._template_promise;
                    },
                    partials = this.options.partials,
                    partials_dir = this.options.partials_dir || '',
                    p;
                // make sure we clear the promise from cache once it's done or failed
                promise.then(clear_promise, clear_promise);
                // cache the fetching promise
                this._template_promise = promise;
                // request the template
                requests.push(uijet.xhr(this.getTemplateUrl())
                    .then(function (response) {
                        // cache result
                        that.template = that.compile(response);
                    }, failure)
                );
                // if we need to fetch partial templates
                if ( partials ) {
                    this.partials || (this.partials = {});
                    // loop over them
                    for ( p in partials ) (function (name, path) {
                        // build the path to each partial
                        var partial_path = uijet.options.templates_path +
                                            partials_dir +
                                            path + "." +
                                            uijet.options.templates_extension;
                        // request that partial
                        requests.push(uijet.xhr(partial_path)
                            .then(function (partial) {
                                // when done cache it
                                that.partials[name] = partial;
                            }, failure)
                        );
                    }(p, partials[p]));
                }
                // when all requests are resolved
                uijet.whenAll(requests).then(function () {
                    // set state to `has_tempalte`
                    that.has_template = true;
                    // tell the user we're done
                    that.notify(true, 'post_fetch_template');
                    // resolve the entire fetching promise
                    dfrd.resolve();
                });
                return promise;
            }
            // like a fulfilled promise
            return this;
        },
        render          : function () {
            // generate the HTML
            var that = this, _super = this._super,
                _html, loadables, do_insert;

            if ( ! this.has_template ) {
                // if `render` was called directly then add a convenience call to fetchTemplate
                return this.fetchTemplate()
                    .then(that.render.bind(that));
            }
            else {
                _html = this.generate();
    
                // notify `pre_render` with the generate HTML
                this.notify(true, 'pre_render', _html);
                // remove the old rendered content
                this._clearRendered();
                // and append the new  
                // allow the user to specify his own method of inserting the HTML
                // if this signal returns `false` we'll skip the lines below
                do_insert = this.notify(true, 'pre_html_insert', _html);
                if ( do_insert !== false ) {
                    // if `insert_before` option is set it's used as a selector or element to indicate where to insert the
                    // generated HTML before.
                    if ( this.options.insert_before ) {
                        uijet.$(_html).insertBefore(this.options.insert_before);
                    } else {
                        // just append the HTML at the end
                        this.$element.append(_html);
                    }
                }
                this.has_content = true;
                // if `defer_images` option is `> 0` then defer the flow till after the loading of images
                loadables = this.options.defer_images ? this.deferLoadables() : [{}];
                // after all was loaded or if ignored deferring it
                return uijet.whenAll(loadables).then(function () {
                    _super.call(that);
                    // if this widget is `scrolled` then prepare its `$element`'s size
                    that.scrolled && that._prepareScrolledSize();
                    that.notify(true, 'post_render');
                });
            }
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
                promises = [],
                _inlines_resolver = function () {
                    _img = null;
                    dfrd.resolve();
                },
                src, _img, dfrd;
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
                promises.push(dfrd.promise());
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
                promises.push(_dfrd.promise());
            });
            return promises.length ? promises : [{}];
        },
        // ### widget.getTemplateUrl
        // @sign: getTemplateUrl()  
        // @return: template_url
        //
        // Gets the URL used by the widget to fetch its template.  
        // Uses uijet's `templates_path` option as a prefix, followed by either `template_name` option or the `id`
        // property, with uijet's `templates_extension` option as the extension suffix.
        getTemplateUrl  : function () {
            return uijet.options.templates_path + (this.options.template_name || this.id) + '.' + uijet.options.templates_extension;
        }
    });
}));
