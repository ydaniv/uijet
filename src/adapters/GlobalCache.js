(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.cache = {};
    uijet.Adapter('GlobalCache', {
        global_cached   : true,
        fetchCache      : function (key) {
            key = key || this.getCacheKey();
            if ( ! this._fetchCache(key) ) {
                if ( key in uijet.cache ) {
                    this.data = uijet.cache[key];
                    this.has_data = true
                } else {
                    return this.has_data = false;
                }
            }
            this.notify('post_fetchcache', this.data);
            return true;
        },
        updateCache     : function (key, data) {
            this.notify('pre_updatecache', key, data);
            this._updateCache(key, data);
            uijet.cache[key] = data;
            return this;
        },
        clearCache      : function (key) {
            var result = this._clearCache(key);
            if ( key ) {
                if ( key in uijet.cache ) {
                    uijet.publish('cache_cleared', key);
                    return delete uijet.cache[key] || result;
                }
            } else {
                uijet.publish('cache_cleared');
                uijet.cache = {};
            }
            return result;
        }
    });
}));