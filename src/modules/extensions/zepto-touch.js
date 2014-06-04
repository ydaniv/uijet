(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'zepto', 'zepto-touch'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(this, function (uijet) {
    /**
     * Zepto touch extension module.
     * 
     * Loads the Zepto touch module and sets the default
     * click event to `tap`.
     * 
     * @module extension/zepto-touch
     * @category Module
     * @sub-category Extensions
     * @see {@link http://zeptojs.com/#touch}
     */
    if ( uijet.support.touch ) {
        uijet.support.click_events.full = 'tap';
    }
}));
