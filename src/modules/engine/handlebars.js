(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'handlebars',
            'uijet_dir/modules/engine/_cache',
            'uijet_dir/widgets/Base'
        ], function (uijet, Handlebars) {
            return factory(uijet, Handlebars);
        });
    }
    else {
        factory(root.uijet, root.Handlebars);
    }
}(this, function (uijet, Handlebars) {
    /**
     * Handlebars engine module.
     *
     * @module engine/handlebars
     * @category Module
     * @sub-category Templates
     * @extends BaseWidget
     * @see {@link http://handlebarsjs.com/}
     * @exports Handlebars
     */
    uijet.use({
        /**
         * Renders a precompiled template.
         *
         * Supports `helpers` and `partials` in the second `options` argument,
         * passed from `this.helpers` and `this.partials` respectively.
         *
         * **note**: `this.partials` is set automatically in the `Templated` mixin.
         *
         * @see {@link http://handlebarsjs.com/execution.html}
         * @method module:engine/handlebars#generate
         * @returns {string} - the rendered template.
         */
        generate: function () {
            return this.template(this.getContext(), {helpers: this.helpers, partials: this.partials})
        }
    }, uijet.BaseWidget.prototype)

        .use({
            /*
             * Precompiles a template string to an executable.
             *
             * @see {@link http://handlebarsjs.com/precompilation.html}
             * @method uijet#compile
             * @param {string} template - template string to compile.
             * @returns {function} - precompiled template function.
             */
            compile: function (template) {
                return Handlebars.compile(template);
            }
        });

    return Handlebars;
}));
