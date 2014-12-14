define([
    'uijet_dir/uijet'
], function (uijet) {

    var import_paths = {
        widgets : 'uijet_dir/widgets/',
        adapters: 'uijet_dir/adapters/',
        mixins  : 'uijet_dir/mixins/'
    };
    /**
     * RequireJS loader module.
     *
     * @module loader/requirejs
     * @category Module
     * @sub-category Loader
     * @extends uijet
     * @see {@link http://requirejs.org/}
     */
    uijet.use({
        /**
         * Imports all missing modules
         * If there's nothing to load or AMD isn't in use it returns the call to `callback` OR `uijet`.
         * Returns either the result of calling `callback` or simply `uijet`.
         *
         * @method module:loader/requirejs#importModules
         * @param {Object} modules - a map of module paths to list of module/file names to load.
         * @param {function} [callback] - a callback to run once the modules are loaded.
         * @param {function} [error] - an error callback to run if loading failed.
         * @returns {*}
         * @see {@link http://requirejs.org/docs/api.html#jsfiles}
         */
        //TODO: allow registration of custom paths.
        importModules        : function (modules, callback, error) {
            var imports = [], m, l;
            // if using an AMD loader
            if ( typeof window.require == 'function' ) {
                // create list of modules to import with paths prepended
                for ( m in modules ) {
                    if ( m in import_paths ) {
                        for ( l = modules[m].length; l--; ) {
                            imports.push(import_paths[m] + modules[m][l]);
                        }
                    }
                }
                // if there's anything to import
                if ( imports.length ) {
                    // import it
                    return window.require(imports, callback, error);
                }
            }
            // if nothing to import then fire `callback` and return it or simply `uijet`
            return callback ? callback() : this;
        }
    })
});
