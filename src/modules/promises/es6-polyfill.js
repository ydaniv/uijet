(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['require', 'uijet_dir/uijet', 'es6-promise', './es6'], function (require, uijet, polyfill) {
            return factory(root, uijet, polyfill, require);
        });
    }
    else {
        factory(root, root.uijet, root.ES6Promise);
    }
}(this, function (root, uijet, polyfill, require) {

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

    polyfill.polyfill();

    if ( require ) {
        require('./es6');
    }
}));
