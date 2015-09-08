# Authoring an Application with uijet

Let's review the basic flow of authoring an application using uijet.

In this guide we're going to use an AMD module loader for the examples below,
also assuming all the paths to the dependencies we will use below are defined,
say, in another file named `main.js` (you can see such
example in the app boilerplates in the `boilerplates` folder).

## Initializing: `uijet.init()`

Every application that uses uijet needs to initialize uijet using it's `init()` method.

So a basic uijet-based app will start like this:

```javascript
define([
    'uijet'
    // ... uijet module dependencies go here ...
], function (uijet) {

    uijet.init();

});
```

The code above will fail since we didn't add the minimal required modules for uijet to run.

## Adding modules

You'll have to also load the required modules, of your choice, for pubsub, Promises
and DOM manipulation.

Let's say we choose native ES6 Promises, PubsubJS and Zepto:

```javascript
define([
    'uijet',
    'uijet_dir/modules/pubsub/pubsubjs',
    'uijet_dir/modules/dom/zepto',
    'uijet_dir/modules/promises/es6'
], function (uijet, pubsub, $) {

    uijet.init();

});
```

Of course, we are assuming above that we have the PubsubJS and Zepto packages
installed in our project.

Now we have the all the basic requirements for a uijet based app.

We're now ready to declare our application logic.

Lets add a short example:

```javascript
define([
    'uijet',
    'uijet_dir/modules/pubsub/pubsubjs',
    'uijet_dir/modules/dom/zepto',
    'uijet_dir/modules/promises/es6',
], function (uijet, pubsub, $) {

    uijet.declare([{
        type: 'Pane',
        config: {
            element: '#more_todo',
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
