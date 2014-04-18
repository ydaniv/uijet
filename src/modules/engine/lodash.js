(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'lodash', 'uijet_dir/widgets/Base'], function (uijet, _) {
            return factory(uijet, _);
        });
    } else {
        factory(uijet, root._);
    }
}(this, function (uijet, _) {
    /**
     * Lodash engine module.
     * 
     * @module engine/lodash
     * @extends BaseWidget
     * @see {@link http://lodash.com/docs#template}
     * @exports lodash
     */
    uijet.use({
        /**
         * Renders a precompiled template.
         * 
         * @see {@link http://lodash.com/docs#template}
         * @method module:engine/lodash#generate
         * @returns {string} - the rendered template.
         */
        generate: function () {
            return this.template(this.getContext());
        },
        /**
         * Precompiles a template string to an executable.
         * 
         * Related options:
         * * `compile_options`: the `options` object argument sent
         * 
         * @see {@link http://lodash.com/docs#template}
         * @method module:engine/lodash#compile
         * @param {string} template - template string to compile.
         * @returns {function} - precompiled template function.
         */
        compile : function (template) {
            return _.template(template, null, this.options.compile_options);
        }
    }, uijet.BaseWidget.prototype);

    return _;
}));
