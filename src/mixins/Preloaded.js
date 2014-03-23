(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {

    /**
     * Preloaded mixin class.
     * 
     * @class Preloaded
     * @extends uijet.BaseWidget
     */
    uijet.Mixin('Preloaded', {
        preloaded   : true,
        /**
         * Automatically start preloading assets, unless instructed
         * not to via `dont_preload` option.
         * 
         * *Note*: {@link Preloaded#preload} is invoked before `_super()` is called.
         * 
         * Related options:
         * * `dont_preload`: unless set to `true`, the instance will automatically call {@link Preloaded#preload} on `init()`.
         * 
         * @memberOf Preloaded
         * @instance
         * @returns {Preloaded}
         */
        init        : function () {
            if ( ! this.options.dont_preload ) {
                this.preload();
            }
            return this._super.apply(this, arguments);
        },
        /**
         * Preloads a list of assets.
         * 
         * Currently, only images are supported, with the following extensions:
         * * jpg/jpeg
         * * png
         * * gif
         * 
         * Related options:
         * * `assets`: list of URLs for assets to preload.
         * 
         * @memberOf Preloaded
         * @instance
         * @param {Array} [assets] - list of URLs of assets to preload.
         * @returns {Promise[]}
         */
        preload     : function (assets) {
            var dfrds = [],
                IMG_EXTENSIONS = 'jpg|jpeg|png|gif';
            // loop over the assets
            (assets || uijet.utils.returnOf(this.options.assets, this) || []).forEach(function (path) {
                var dfrd;
                // check if this is an image file by looking at its extension
                if ( ~ IMG_EXTENSIONS.search(RegExp(path.substring(path.lastIndexOf('.')), 'i')) ) {
                    // it's an image so call `preloadIamge`
                    dfrd = this.preloadImage(path);
                }
                // push the promise to the stack
                dfrds.push(dfrd || {});
            }, this);
            return dfrds;
        },
        /**
         * Loads an image specified by `path`, and returns a promise
         * for this action.
         * 
         * Related options:
         * * `preload_img_el`: whether to use an `<img>` element to preload.
         * Otherwise the `Image` object will be used.
         * Necessary in some less compliant platforms.
         * 
         * @memberOf Preloaded
         * @instance
         * @param {string} path - URL of an image.
         * @returns {Promise}
         */
        preloadImage: function (path) {
            var img, dfrd = uijet.Promise();
            // if the `preload_img_el` option is set
            if ( this.options.preload_img_el ) {
                // use the DOM's createElement to create the image
                img = document.createElement('img');
            } else {
                // otherwise create a new `Image` object
                img = new Image();
            }
            // set the `src`
            img.src = path;
            // if this image is already cached it might be done already
            if ( img.complete ) {
                // clear the memory and resolve the promise
                img = null;
                dfrd.resolve();
            } else {
                // image is not in cache so set a resolving handler on its events
                img.onload = img.onerror = function () {
                    // clear the memory and resolve the promise
                    img = null;
                    dfrd.resolve();
                };
            }
            return dfrd.promise();
        }
    });
}));
