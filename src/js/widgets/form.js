uijet.Widget('Form', {
    options         : {
        type_class  : 'uijet_form',
        signals     : {
            post_init   : function () {
                this.render();
            },
            post_wake   : function () {
                this.$element.find('input').eq(0).focus();
            }
        }
    },
    update          : function () {
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
        uijet.Form(this.id, this);
        return this;
    },
    getDataUrl  : function () {
        return this.options.data_url;
    }
});