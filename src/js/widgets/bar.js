uijet.Widget('Bar', {
    options : {
        type_class  : 'uijet_bar'
    },
    prepareElement  : function () {
        var class_name = 'clearfix';
        if ( this.options.vertical ) class_name += ' vertical';
        this.$element.addClass(class_name);
        this._super();
        return this;
    },
    _wrap           : function () {
        this.$wrapper = this.$element;
        this._super();
        return this;
    }
});
