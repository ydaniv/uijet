(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'handlebars', 'uijet_dir/widgets/Base'], function (uijet, Handlebars) {
            return factory(uijet, Handlebars);
        });
    } else {
        factory(uijet, root.Handlebars);
    }
}(this, function (uijet, Handlebars) {
    /**
     * Handlebars engine module.
     * 
     * @module engine/handlebars
     * @extends uijet
     */
    uijet.use({
        /**
         * Renders a compiled template.
         * 
         * Supports `helpers` and `partials` in the second `options` argument,
         * passed from `this.helpers` and `this.partials` respectively.
         * 
         * **note**: `this.partials` is set automatically in the `Templated` mixin.
         * 
         * @method module:engine/handlebars#generate
         * @see {@link http://handlebarsjs.com/execution.html}
         * @returns {string} - the rendered template.
         */
        generate: function () {
            return this.template(this.getContext(), {helpers: this.helpers, partials: this.partials})
        },
        /**
         * Compiles a template string to an executable.
         * 
         * @method module:engine/handlebars#compile
         * @param {string} template - template string to compile.
         * @returns {function} - compiled template function.
         */
        compile : function (template) {
            return Handlebars.compile(template);
        }
    }, uijet.BaseWidget.prototype);

    return Handlebars;
}));
