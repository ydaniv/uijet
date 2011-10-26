uijet.Widget('View', {
    options         : {
        type_class  : 'uijet_view',
        signals     : {
            pre_wake: function () {
                this.publish('pre_load', null, true);
            }
        }
    },
    register    : function () {
        this.setRoute().registerRoute();
        uijet.View(this.id, this);
        this.checkState();
        return this;
    },
    appear      : function () {
        var that = this;
        this.notify('pre_appear');
        this.$element.addClass('current top');
        this._setCloak(false);
        $.when( this.transit() ).then(function () {
            //TODO: move the current view handling mechnism to uijet
            if ( uijet.current_view !== that ) {
                uijet.current_view && uijet.current_view.sleep();
                uijet.current_view = that;
            }
            that.publish('post_load', null, true);
        });
        return this;
    }
}, ['Routed', 'Transitioned']);