(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.context = {};
    uijet.Adapter('GlobalContext', {
        global_contexted: true,
        substitute      : function(template, obj) {
            var SUBSTITUTE_REGEX = /\{([^\s\}:]*):([^\s\}]+)\}/g, _context = this.context;
            return template.replace(SUBSTITUTE_REGEX, function(match, widget_id, params_key){
                return widget_id ? obj[widget_id][params_key] : _context[params_key];
            });
        },
        _setContext : function (context) {
            if ( context ) {
                this.context = context || this.context;
                uijet.context[this.id] = this.context; // cache the result in the app
            }
            return this;
        }
    });
}));