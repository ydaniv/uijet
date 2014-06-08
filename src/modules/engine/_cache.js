(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(root.uijet);
    }
}(this, function (uijet) {

    uijet.use({
        templates   : {},
        template    : function (template_url) {
            var template;
            if ( template = uijet.templates[template_url] ) {
                return template;
            }
            else {
                return uijet.xhr(template_url).then(function (response) {
                    return uijet.templates[template_url] = response;
                });
            }
        }
    });

}));
