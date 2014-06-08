define(function () {

    return {
        '/'        : function () {
            console.log('Hello!');
        },
        '/:product': function (product) {
            console.log(product);
        }
    };

});
