// ### AMD wrapper
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'uijet_dir/widgets/Base'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Widget('Bar', {
        options : {
            type_class  : 'uijet_bar',
            dont_wrap   : true
        },
        prepareElement  : function () {
            // add a `clearfix` class because Bars sometimes contain `float`ed elements
            var class_name = 'clearfix';
            if ( this.options.vertical ) class_name += ' vertical';
            this.$element.addClass(class_name);
            this._super();
            return this;
        }
    });
}));
