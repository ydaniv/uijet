// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'mustache', 'uijet_dir/widgets/Base'], function (uijet, Mustache) {
            return factory(uijet, Mustache);
        });
    } else {
        factory(uijet, root.Mustache);
    }
}(this, function (uijet, Mustache) {
    uijet.use({
        generate: function () {
            return this.template(this.data || this.context, this.partials);
        },
        compile : function (template, partial) {
            return partial ? Mustache.compilePartial(partial, template) : Mustache.compile(template);
        }
    }, uijet.BaseWidget.prototype);

    return Mustache;
}));