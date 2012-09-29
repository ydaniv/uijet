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
            return Mustache.to_html(this.template, this.data || this.context, this.partials);
        }
    }, uijet.BaseWidget.prototype);

    return Mustache;
}));