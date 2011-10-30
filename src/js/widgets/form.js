uijet.Widget('Form', {
    options     : {
        type_class  : 'uijet_form'
    },
    init        : function (options) {
        this.setOptions(options)
            .setId()
            .setElement()
            ._setCloak(true)
            .prepareElement()
            .setInitOptions()
            .register()
            ._saveOriginal()
            .render(); // that's the difference
        this.notify('post_init');
        return this;
    },
    update      : function () {
        var that = this;
        return $.ajax({
            url     : this.getDataUrl(),
            type    : 'post',
            data    : this.$element.serialize(),
            success : function (response) {
                that.has_data = true;
                that.data = response;
                that.notify('post_fetch_data', response);
                that.publish('post_fetch_data', that.data);
            },
            error   : function (response) {
                that.notify('update_error', response);
            }
        });
    },
    //TODO: re-implement the routing mechanism for submitting forms
    register    : function () {
        Akashi.Form(this.id, this);
        return this;
    },
    appear      : function () {
        this._setCloak(false)
            .$element.find('input').eq(0).focus();
        return this;
    },
    getDataUrl  : function () {
        return this.options.data_url;
    },
    clearErrors : function () {
        this.$element.find('.error').empty();
        return this;
    }
});