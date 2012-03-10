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
    uijet.Mixin('Persisted', {
        persisted   : true,
        cache       : {},
        update      : function (invalidate_cache) {
            var success, key;
            // allow the user to override the cache invalidation flag
            invalidate_cache = this.notify('pre_persisted_update', invalidate_cache);
            // if set to `true` then invalidate
            if ( invalidate_cache === true ) {
                this.has_data = false;
            } else {
                // or fetch from cache  
                // notify the `pre_fetchcache` signal and allow the user to set the key to use
                key = this.notify('pre_fetchcache');
                success = this.fetchCache(key);
            }
            if ( success && this.has_data ) {
                return this;
            }
            // didn't find in cache or was asked to invalidate it, send update request...
            return this._super();
        },
        setData     : function (data) {
            this._super(data);
            // if update was successful
            if ( this.has_data ) {
                // update the cache with new data
                this.updateCache(this.getCacheKey(), this.data);
            }
            return this;
        },
        // ### widget.fetchCache
        // @sign: fetchCache(key)  
        // @return: _fetchCache(key)
        //
        // Base method for fetching data from cache.  
        // This method is the public API to be overridden by adapters.
        fetchCache  : function (key) {
            var success = this._fetchCache(key);
            success && this.notify('post_fetchcache', this.data);
            return success;
        },
        // ### widget.updateCache
        // @sign: updateCache(key)  
        // @return: _updateCache(key)
        //
        // Base method for updating cached data.  
        // This method is the public API to be overridden by adapters.
        updateCache : function (key, data) {
            this.notify('pre_updatecache', key, data);
            return this._updateCache(key, data);
        },
        // ### widget.clearCahce
        // @sign: clearCahce([key])  
        // @return: _clearCahce(key)
        //
        // Base method for clearing cached data.  
        // This method is the public API to be overridden by adapters.
        clearCahce  : function (key) {
            return this._clearCache(key);
        },
        // ### widget.getCacheKey
        // @sign: getCacheKey()  
        // @return: _getCacheKey()
        //
        // Base method for getting a key to fetch store data from cache.  
        // This method is the public API to be overridden by adapters.
        getCacheKey : function () {
            return this._getCacheKey();
        },
        // ### widget._fetchCache
        // @sign: _fetchCache(key)  
        // @return: `true` OR `false`
        //
        // Internal method that fetches data from `this.cache`.  
        // The found data is put into `this.data`.  
        // It returns a `Boolean` that tells whether requested data was found in cache.
        _fetchCache : function (key) {
            key = key || this.getCacheKey();
            if ( key in this.cache ) {
                this.data = this.cache[key];
                return this.has_data = true;
            }
            return this.has_data = false;
        },
        // ### widget._updateCache
        // @sign: _updateCache(key, data)  
        // @return: this
        //
        // Internal method that updates cached data in `this.cache`.
        _updateCache: function (key, data) {
            this.cache[key] = data;
            return this;
        },
        // ### widget._clearCache
        // @sign: _clearCache([key])  
        // @return: `true` OR `false`
        //
        // Internal method that clears an entry form `this.cache` or all of it.  
        // Returns `true` if anything was cleared. Otherwise returns `false`.
        _clearCache : function (key) {
            if ( key ) {
                if ( key in this.cache ) {
                    return delete this.cache[key];
                }
            } else {
                this.cache = {};
                return true;
            }
            return false;
        },
        // ### widget._getCacheKey
        // @sign: _getCacheKey()  
        // @return: getDataUrl()
        //
        // Internal method that gets the key to be used to pull data from cache.  
        // In its base form it uses the URL used to ask for the same required data from server as the key.
        _getCacheKey : function () {
            return this.getDataUrl();
        }
    });
}));
