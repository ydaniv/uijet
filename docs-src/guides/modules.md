uijet modules
=============

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

### Example:

An example of an application loading basic modules can look as follows:

```javascript

define([
    'uijet_dir/uijet',
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

Now we can use jQuery as an extension of uijet:

```javascript

uijet.$('div').addClass('fancy');

```

and wrap objects and function calls to return a promise:

```javascript

uijet.when(someAction()).then(...);

```

If we would like later to use When.js for Promises, all we had to do is replace the above
dependencies:

```javascript

define([
    ...,
    'uijet_dir/modules/promises/when'
], function (uijet, $, Ebox, when) {

```

and we wouldn't have to change another line of code in our project.

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

Then, only after we do this:

```javascript

Router({
    '/example': function () { console.log("example"); },
})

```

The module will instantiate a Router instance and complete extending uijet to have
routing capabilities.
