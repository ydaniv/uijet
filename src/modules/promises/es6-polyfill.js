(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['es6-promise', 'uijet_dir/modules/promises/es6'], function (polyfill, es6) {
            return factory(root, polyfill, es6);
        });
    }
    else {
        factory(root, root.ES6Promise);
    }
}(this, function (root, polyfill, es6) {

    /**
     * ES6-Promise polyfill promises module.
     *
     * **note**: If not using an AMD loader you'll have to include the `promises/es6` module script right below this one.
     *
     * @module promises/es6-polyfill
     * @category Module
     * @sub-category Promises
     * @extends uijet
     * @see {@link https://github.com/jakearchibald/es6-promise/blob/master/README.md}
     */
    return function (uijet) {
        polyfill.polyfill();

        return es6(uijet);
    };
}));
