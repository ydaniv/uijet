// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Mixin('Preloaded', {
        preloaded   : true,
        // ### widget.preload
        // @sign: preload([assets])  
        // @return: promises_array
        //
        // Preloads assets, specified either by the `assets` argument or the `options.assets`.  
        // `assets` should be an `Array` of URLs to the assets.  
        // Returns an `Array` of promise objects that resolve once all assets finished loading,
        // successfully or not.
        preload     : function (assets) {
            var dfrds = [],
                that = this,
                IMG_EXTENSIONS = 'jpg|jpeg|png|gif';
            // loop over the assets
            (assets || uijet.utils.returnOf(this.options.assets, this) || []).forEach(function (path) {
                var dfrd;
                // check if this is an image file by looking at its extension
                if ( ~ IMG_EXTENSIONS.search(RegExp(path.substring(path.lastIndexOf('.')), 'i')) ) {
                    // it's an image so call `preloadIamge`
                    dfrd = that.preloadImage(path);
                }
                // push the promise to the stack
                dfrds.push(dfrd || {});
            });
            return dfrds;
        },
        // ### widget.preloadImage
        // @sign: preloadImage(path)  
        // @return: promise
        //
        // Takes a path `String` and returns a promise that resolves when the image,
        // loaded with the given `path` has completed loading either successfully or not.
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
