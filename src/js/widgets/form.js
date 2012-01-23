uijet.Widget('Form', {
    options         : {
        type_class  : 'uijet_form'
    },
    send            : function () {
        var that = this;
        this.notify('pre_send');
        if ( this.options.route_send ) {
            this.runRoute(this.getSendUrl() + this.getSerialized(), true);
            return this;
        }
        return $.ajax(this.getSendUrl(), {
            type    : this.$element.attr('method'),
            data    : this.getSerialized(),
            context : this
        }).done(function (response) {
            this.setData(response);
            this.notify('post_send_data', response);
            this.publish('post_send_data', this.data);
        }).fail(function () {
            this.notify.apply(that, ['send_error'].concat(Array.prototype.slice.call(arguments)));
        }).always(function () {
            this._finally();
        });
    },
    //TODO: re-implement the routing mechanism for submitting forms
    register        : function () {
        var that = this;
        if ( this.options.route_send ) {
             this.$element.bind('submit', function (e) {
                 e.preventDefault();
                 e.stopPropagation();
                 that.send();
             });
        } else {
           uijet.Form(this.id, this);
        }
        this._super();
        return this;
    },
    appear          : function () {
        var $inputs;
        this._super();
        // on iOS devices the element.focus() method is broken
        if ( ! this.options.dont_focus ) {
            $inputs = this.$element.find('input');
            $inputs.length && $inputs.get(0).focus();
        }
        return this;
    },
    setInitOptions  : function () {
        this._super();
        if ( this.options.serializer ) {
            this.getSerialized = this.options.serializer;
        }
        return this;
    },
    getDataUrl      : function () {
        return this.options.data_url;
    },
    getSendUrl      : function () {
        return this.options.send_url;
    },
    getSerialized   : function () {
        return this.$element.serialize();
    },
    clearErrors     : function () {
        this.$element.find('.error').empty();
        return this;
    }
});