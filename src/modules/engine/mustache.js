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
            return Mustache.render(this.template, this.data || this.context, this.partials);
        },
        compile : function (template, is_partial) {
            return is_partial ? Mustache.compile(template) : Mustache.compilePartial(template);
        }
    }, uijet.BaseWidget.prototype);

    return Mustache;
}));