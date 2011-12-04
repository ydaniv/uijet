uijet.Widget('Button', {
    options         : {
        type_class  : 'uijet_button',
        dom_events  : {
            click   : function (e) {
                var _publish = this.notify('pre_click');
                if ( _publish !== false ) {
                    this.publish('clicked', this.context);
                }
                return false;
            }
        }
    },
    setInitOptions  : function () {
        var that = this, routing = that.options.routing;
        this._super();
        if ( this.options.data_url ) {
            this.$element.click(function () {
                that.runRoute(that.getDataUrl(), typeof routing == 'undefined' ? true : typeof routing == 'function' ? ! routing.call(that, $(this)) : ! routing);
            });
        }
        return this;
    },
    render          : function () {
        this.position()
            ._super();
        return this;
    },
    position        : function () {
        var _pos = this.options.position, _$parent;
        if ( _pos ) {
            _$parent = this.$element.parent(); // get parent element
            //make sure the parent will contain this button properly
            if ( !~ 'relative fixed absolute'.indexOf(_$parent.css('position')) ) {
                _$parent[0].style.position = 'relative';
            }
            this.$element.addClass('fixed');
            if ( typeof _pos == 'string') {
                this.$element.addClass( _pos);
                if ( _pos == 'center') {
                    this._center();
                }
            } else if ( Object.prototype.toString.call(_pos) == '[object Object]' ) {
                this.$element.css(_pos);
            }
        }
        return this;
    },
    getDataUrl      : function () {
        return this.substitute(this.options.data_url, this.context);
    }
});
