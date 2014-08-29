# Authoring an Application with uijet

Let's review the basic flow of authoring an application using uijet.

In this guide we're going to use AMD module loader for the example bellow,
also assuming there's a definition of all the paths to the dependencies
we will use bellow, say, in another file named `main.js` (you can see such
example in the app boilerplates in the `boilerplates` folder).

Every application that uses uijet needs to initialize uijet using it's `init()` method.

## uijet.init()

So a basic uijet-based app will start like this:

```javascript
define([
    'uijet'
], function (uijet) {

    uijet.init();

});
```

The code above will fail since we didn't add the minimal required modules for uijet to run.

## Adding modules

You'll have to also load the required modules, of your choice, for pubsub, Promises
and DOM manipulation.

Let's say we choose PubsubJS, When.js and Zepto:

```javascript
define([
    'uijet',
    'uijet_dir/modules/pubsub/pubsubjs',
    'uijet_dir/modules/promises/when',
    'uijet_dir/modules/dom/zepto'
], function (uijet, pubsub, when, $) {

    uijet.init();

});
```

Of course, we are assuming above that we have the PubsubJS, When.js and Zepto packages
installed in our project.
Now we have the all the basic requirements for a uijet based app.

We're now ready to declare our views and application logic.
Lets add a short example:

```javascript
define([
    'uijet',
    'uijet_dir/modules/pubsub/pubsubjs',
    'uijet_dir/modules/promises/when',
    'uijet_dir/modules/dom/zepto'
], function (uijet, pubsub, when, $) {

    uijet.declare([{
        type: 'Pane',
        config: {
            element: '#new_todo',
            dom_events: {
                keypress: function (e) {
                    console.log(e.target.value);
                }
            }
        }
    }, {
        type: 'List',
        config: {
            element: '#todos_list'
        }
    }]);

    uijet.init();

});
```

In the example above you'll have 2 components created.
These form a scaffold for a simple "Todo" app.

## Coming soon:

A fully detailed tutorial on how we created
a Todo app for the [TodoMVC](http://todomvc.com/) project in the tutorials section.
