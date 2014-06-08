define(['backbone'], function (Backbone) {

    var Products = new Backbone.Collection.extend({
        url  : '/products'
    });

    return {
        Products: Products
    };

});
