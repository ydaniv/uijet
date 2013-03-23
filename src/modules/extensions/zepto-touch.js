(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'zepto', 'zepto-touch'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(this, function (uijet) {
    if ( uijet.support.touch ) {
        uijet.support.click_events.full = 'tap';
    }
}));