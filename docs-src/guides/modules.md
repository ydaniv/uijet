# uijet modules

uijet embraces the principle of doing 1 thing (or at most 2) and doing it right.

That's why it leaves the implementation of all the main parts of the application up 
to external libraries, of your choice, and glues them together into a coherent interface 
which allows them to be abstracted and easily swappable.

## Using modules

To use a module you make sure it's loaded as a dependency of your main application
file, with its own dependencies loaded before it.

Some modules hook themselves into uijet automatically, and export the 3rd party library
for further customization.
Others require further configuration, e.g. router modules.

## Example Usage:

An example of an application loading basic modules can look as follows:

```javascript
define([
    'uijet',
    'uijet_dir/modules/dom/jquery',
    'uijet_dir/modules/pubsub/eventbox',
    'uijet_dir/modules/promises/jquery'
], function (uijet, $, Ebox) {

    uijet.init();

});

```

In the above example we're loading uijet and the 3 mandatory modules required for
uijet to run. In this case we're using jQuery for DOM library, Evenbox as pubsub module
and jQuery's Deferred object as Promises.

### Using a module's API Over uijet

Now we can use jQuery as an extension of uijet:

```javascript
uijet.$('div').addClass('fancy');

```

and wrap objects and function calls to return a promise:

```javascript
uijet.when(someAction()).then(...);

```

### Swapping modules

If we would like later to use When.js for Promises, all we had to do is replace the above
dependencies:

```javascript
define([
    ...,
    'uijet_dir/modules/promises/when'
], function (uijet, $, Ebox, when) {

```

and we wouldn't have to change another line of code in our project.

### Lazy modules

Lets say we now wish to add a router, Director.js in this case.
All we need to do is add it to the app's dependencies:

```javascript
define([
    ...,
    'uijet_dir/modules/router/director'
], function (uijet, $, Ebox, when, Router) {

```

In this case the module is not yet attached to uijet. The exported `Router` is
a function that requires either a Director's `Router` instance or a config object 
for creating an instance.

Since Director is already loaded and adds its own namespace to the global `window` object
we can grab the `Router` constructor straight from there.

Or alternatively, we could just do this:

```javascript
Router({
    '/example': function () { console.log("example"); },
})

```

The module will instantiate a Router instance and complete extending uijet to have
routing capabilities.

## modules Best Practices

It's best to keep modules' specific tangent to your application's code, and separated
from it, as much as possible. This will keep that modules easily swappable and much
more maintainable.

A good example for this are models.
Lets say we're using the Backbone `data` module, i.e. using Backbone.js' models and collection
for data management (a.k.a the M in the MVC).

You could insert your model declarations directly to your app's main file, as in:

*Bad!*

`app.js`

```javascript
uijet.init({
    resources: {
        Todos: backbone.Collection.extend({
            url: '/path/to/todos'
        })
    }
});

```

Or this:

*Good*

`resources.js`

```javascript
define([
    'uijet_dir/modules/data/backbone'
], function (backbone) {

    var Todos = backbone.Collection.extend({
        url: '/path/to/todos'
    });

    return {
        Todos: Todos
    };

});

```

`app.js`

```javascript
define([
    'uijet',
    'resources'
], function (uijet, resources) {

    uijet.init({
        resources: resources
    });

});

```
