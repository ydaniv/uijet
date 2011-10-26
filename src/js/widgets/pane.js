uijet.Widget('Pane', {
    options : {
        type_class  : 'uijet_pane',
        signals     : {
            pre_wake: function () {
                this.publish('pre_load', null, true);
            }
        }
    }
}, ['Routed', 'Templated', 'Transitioned']);