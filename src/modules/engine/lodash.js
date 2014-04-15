(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'lodash', 'uijet_dir/widgets/Base'], function (uijet, _) {
            return factory(uijet, _);
        });
    } else {
        factory(uijet, root._);
    }
}(this, function (uijet, _) {
    uijet.use({
        generate: function () {
            return this.template(this.getContext());
        },
        compile : function (template, options) {
            return _.template(template, null, options);
        }
    }, uijet.BaseWidget.prototype);

    return _;
}));
