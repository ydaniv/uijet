(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'handlebars', 'uijet_dir/widgets/Base'], function (uijet, Handlebars) {
            return factory(uijet, Handlebars);
        });
    } else {
        factory(uijet, root.Handlebars);
    }
}(this, function (uijet, Handlebars) {
    uijet.use({
        generate: function () {
            return this.template(this.getData(), {helpers: this.helpers, partials: this.partials})
        },
        compile : function (template) {
            return Handlebars.compile(template);
        }
    }, uijet.BaseWidget.prototype);

    return Handlebars;
}));
