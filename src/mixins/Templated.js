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

    if ( ! uijet.BaseWidget.prototype.generate ) {
        uijet.use({
            /**
             * Generates an HTML string from a template.
             * 
             * @see {@link uijet.utils#format}
             * @memberOf BaseWidget
             * @instance
             * @returns {string} - generated html string.
             */
            generate: function () {
                return uijet.utils.format(this.template, this.getContext());
            }
        }, uijet.BaseWidget.prototype);
    }

    /**
     * Templated mixin class.
     * 
     * @mixin Templated
     * @extends uijet.BaseWidget
     */
    uijet.Mixin('Templated', {
        templated       : true,
        /**
         * Starts loading the template.
         * Builds the URL to fetch the template from options.
         * 
         * #### Related options:
         * 
         * * `dont_auto_fetch_template`: if `true` will not load the template file on `init()`.
         * 
         * @memberOf Templated
         * @instance
         * @returns {Templated}
         */
        init            : function () {
            this.holdSignal('post_init');
            this._super.apply(this, arguments);

            this.template_url = uijet.options.templates_path + (this.options.template_name || this.id) + '.' + uijet.options.templates_extension;

            if ( ! this.options.dont_auto_fetch_template ) {
                this._fetchTemplate();
            }
            this.releaseSignal('post_init');
            return this;
        },
        /**
         * Renders the template.
         * Attempts to fetch the template if it wasn't fetched.
         * 
         * It is also possible to defer the end of rendering till after all
         * content images have been fully loaded using the `defer_images` option.
         * 
         * #### Signals:
         * 
         * * `pre_render`: triggered after content is generated but before old contents of `this.$element` is removed.
         * Takes the generated HTML string.
         * * `pre_html_insert`: triggered before content is inserted into the element. Takes the generated HTML string.
         * If it returns `false` then content insertion will be skipped.
         * * `post_render`: triggered at the end.
         * 
         * #### Related options:
         * 
         * * `insert_before`: an element, or a query selector, to insert the rendered content before. By default
         * content is appended to the end `this.$element`'s contents.
         * * `defer_images`: if truthy it invokes {@link Templated#deferLoadables} and the returned `Promise`
         * will depend on that action being resolved.
         * 
         * @memberOf Templated
         * @instance
         * @returns {Promise}
         */
        render          : function () {
            // generate the HTML
            var that = this, _super = this._super,
                _html, loadables, do_insert;

            if ( ! this.has_template ) {
                // if `render` was called directly then add a convenience call to _fetchTemplate
                return this._fetchTemplate()
                    .then(this.render.bind(this));
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
        /**
         * Finds all content images, `<img>` tags or in inlined
         * styles, and returns a `Promise` that is resolved once
         * all of these are loaded.
         * 
         * @memberOf Templated
         * @instance
         * @returns {Promise[]}
         */
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
                _img, dfrd;
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
            return promises;
        },
        /**
         * Loads the template(s).
         * 
         * #### Signals:
         * 
         * * `fetch_template_error`: 
         * 
         * #### Related options:
         * 
         * * `template_name`: name of the template file to load. Defaults to `this.id`.
         * * `partials`: list of file names of partials to load. 
         * * `partials_dir`: if the partial fields are nested set this to the name of the dir that contains them.
         * 
         * #### Related uijet options:
         * 
         * * `templates_path`: path for the templates directory.
         * * `templates_extension`: extension for the template files.
         * 
         * @memberOf Templated
         * @instance
         * @returns {Promise|Templated}
         */
        _fetchTemplate  : function () {
            // if we don't have the template cached
            if ( ! this.has_template ) {
                // create a promise for retrieving all templates
                var that = this,
                    // a stack for all template GET requests
                    requests = [],
                    partials = this.options.partials,
                    partials_dir = this.options.partials_dir || '',
                    p;

                // request the template
                requests.push(uijet.xhr(this.template_url)
                    .then(function (response) {
                        // cache result
                        that.template = that.compile ? that.compile(response) : response;
                    }));

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
                            }));
                    }(p, partials[p]));
                }

                // when all requests are resolved
                return uijet.whenAll(requests).then(function () {
                    // set state to `has_tempalte`
                    that.has_template = true;
                });
            }
            // like a fulfilled promise
            return this;
        }
    });
}));
