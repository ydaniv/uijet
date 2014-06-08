(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'underscore', 'uijet_dir/modules/engine/_cache', 'uijet_dir/widgets/Base'], function (uijet, _) {
            return factory(uijet, _);
        });
    } else {
        factory(root.uijet, root._);
    }
}(this, function (uijet, _) {
    /**
     * Underscore engine module.
     * 
     * @module engine/Underscore
     * @category Module
     * @sub-category Templates
     * @extends BaseWidget
     * @see {@link http://underscorejs.org/#template}
     * @exports underscore
     */
    uijet.use({
        /**
         * Renders a precompiled template.
         * 
         * @see {@link http://underscorejs.org/#template}
         * @method module:engine/underscore#generate
         * @returns {string} - the rendered template.
         */
        generate: function () {
            return this.template(this.getContext());
        },
        /**
         * Precompiles a template string to an executable.
         * 
         * #### Related options:
         * 
         * * `compile_options`: the `options` object argument sent
         * 
         * @see {@link http://underscorejs.org/#template}
         * @method module:engine/underscore#compile
         * @param {string} template - template string to compile.
         * @returns {function} - precompiled template function.
         */
        compile : function (template) {
            return _.template(template, null, this.options.compile_options);
        }
    }, uijet.BaseWidget.prototype);

    return _;
}));
