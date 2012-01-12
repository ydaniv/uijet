uijet.Mixin('Layered', {
    appear      : function () {
        this.setCurrent()
            ._super();
        return this;
    },
    setCurrent  : function () {
        uijet.switchCurrent(this);
        return this;
    }
});
