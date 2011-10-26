uijet.Widget('Button', {
    options : {
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
    position: function () {
        var _pos = this.options.position;
        if ( _pos ) {
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
    }
});