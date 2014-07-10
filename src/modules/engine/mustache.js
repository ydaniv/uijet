(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'mustache',
            'uijet_dir/modules/engine/_cache',
            'uijet_dir/widgets/Base'
        ], function (uijet, Mustache) {
            return factory(uijet, Mustache);
        });
    }
    else {
        factory(root.uijet, root.Mustache);
    }
}(this, function (uijet, Mustache) {
    /**
     * Mustache engine module.
     *
     * @module engine/mustache
     * @category Module
     * @sub-category Templates
     * @extends BaseWidget
     * @see {@link https://github.com/janl/mustache.js/#usage}
     * @exports Mustache
     */
    uijet.use({
        /**
         * Renders a template.
         *
         * @see {@link https://github.com/janl/mustache.js/#usage}
         * @method module:engine/mustache#generate
         * @returns {string} - the rendered template.
         */
        generate: function () {
            return Mustache.render(this.template, this.getContext(), this.partials);
        }
    }, uijet.BaseWidget.prototype)

        .use({
            /*
             * Parses a template string ahead of time for faster rendering.
             *
             * @see {@link https://github.com/janl/mustache.js/#pre-parsing-and-caching-templates}
             * @method uijet#compile
             * @param {string} template - template string to compile.
             * @returns {string} - the same `template` string.
             */
            compile: function (template) {
                return Mustache.parse(template), template;
            }
        });

    return Mustache;
}));
