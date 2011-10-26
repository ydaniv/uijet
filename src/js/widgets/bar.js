uijet.Widget('Bar', {
    options : {
        type_class  : 'uijet_bar'
    },
    prepareElement  : function () {
        this.$element.addClass('uijet_widget ' + this.options.type_class + ' clearfix');
        this.setSize();
        return this;
    }
});