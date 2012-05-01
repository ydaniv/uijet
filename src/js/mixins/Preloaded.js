//TODO: add docs
// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['jquery', 'uijet_dir/uijet'], function ($, uijet) {
            return factory($, uijet);
        });
    } else {
        factory(jQuery, uijet);
    }
}(function ($, uijet) {
    uijet.Mixin('Preloaded', {
        preloaded   : true,
        preload     : function (assets) {
            var dfrds = [],
                that = this,
                IMG_EXTENSIONS = 'jpg|jpeg|png|gif';
            (assets || this.getAssets()).forEach(function (path) {
                var dfrd;
                if ( ~ IMG_EXTENSIONS.search(RegExp(path.substring(path.lastIndexOf('.')), 'i')) ) {
                    dfrd = that.preloadImage(path);
                }
                dfrds.push(dfrd || {});
            });
            return dfrds;
        },
        preloadImage: function (path) {
            var img, dfrd = $.Deferred();
            if ( this.options.preload_img_el ) {
                img = document.createElement('img');
            } else {
                img = new Image();
            }
            img.src = path;
            if ( img.complete ) {
                img = null;
                dfrd.resolve();
            } else {
                img.onload = img.onerror = function () {
                    img = null;
                    dfrd.resolve();
                };
            }
            return dfrd.promise();
        },
        getAssets   : function () {
            return this.assets || [];
        }
    });
}));