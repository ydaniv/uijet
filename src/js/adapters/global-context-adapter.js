uijet.Adapter('GlobalContext', {
    getDataUrl  : function () {
        return this.substitute(this.options.data_url + Akashi.getSid(this.options.data_url), Akashi.context);
    },
    substitute      : function(template, obj) {
        var SUBSTITUTE_REGEX = /\{([^\s\}:]*):([^\s\}]+)\}/g, _context = this.context;
        return template.replace(SUBSTITUTE_REGEX, function(match, widget_id, params_key){
            return widget_id ? obj[widget_id][params_key] : _context[params_key];
        });
    }
});
