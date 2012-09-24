// ### AMD wrapper
(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'mustache', 'uijet_dir/widgets/Base'], function (uijet) {
            return factory(uijet);
        });
    } else {
        root.uijet_engine = factory(uijet);
    }
}(this, function (uijet) {
    return function () {
        uijet.use({
            engine              : function () {
                return Mustache.to_html(this.template, this.data || this.context, this.partials);
            }
        }, uijet.BaseWidget.prototype);
    
        return Mustache;
    };
}));