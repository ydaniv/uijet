# Using and Creating Widgets


Widgets are declaration of generic and reusable UI components.

The basic __Widgets__ that come bundled with uijet are the most basic building blocks
for creating any type of UI component. uijet gives you the tools for both extending
them and composing them together to form any kind of UI component you can think of.

These are:

* Pane
* Button
* List
* Overlay
* Form
* View

A view (as in the V in MVC) instance in an application is an instance of a Widget.

## Using Widgets

To use one of the above Widgets in your app you simply declare an instance of that Widget.
Example in a UI module file: 

`ui.js`

```javascript
define([
    'uijet'
], function (uijet) {

    uijet.declare({
        type: 'List',
        config: {
            element: '#groovie_list'
        }
    });

});
```

In the above example we load `uijet` and use it to `declare()` an instance of a `List` widget.

Once uijet starts it will automatically load the `List` Widget, create an instance of it, and bind it
to the DOM element set in the `element` option.

The actual `List` view that will be created with the `id`: `groovie_list` is *injected* with
the `List` Widget and all its *dependencies*.

Note that `uiject.declare()` *does not return an instance* of the created view, rather it
*registers* it to the uijet *sandbox*.
The only way another component can communicate with it is via events.

## Using Composites

uijet also has __Composites__ bundled with it, which are higher level components
that are composed from 2 or more basic __Widgets__.

Some of uijet's Composites are:

* Modal
* Slider
* Select
* Datepicker

Using a bundled Composite only requires you to load it beforehand:

```javascript
define([
    'uijet',
    'uijet_dir/composites/Modal'
], function (uijet) {

    uijet.declare({
        type: 'Modal',
        config: {
            element: '#login_modal',
            buttons: [{
                element: '#login_modal_ok'
            }, {
                element: '#login_modal_cancel'
            }],
            app_events: {
                'login_modal_ok.clicked': 'confirm',
                'login_modal_cancel.clicked': 'sleep'
            }
        }
    });

});
```

The above example will create an instance of a Modal dialog with 2 buttons.

## Creating a view in uijet

Creating a view in uijet is comprised of the following steps:

### Defining a Widget "class"

Firstly, defining a Widget class:

```javascript
uijet.Widget('KickAssPane', {
    // methods and properties for KickAssPane
});
```

We could also add a Widget dependency:

```javascript
uijet.Widget('KickAssList', {
    // methods and properties for KickAssList
}, [
    'List'
]);
```

In the example above we defined a new `KickAssList` Widget that inherits from the basic `List`.

We could also add a Mixin dependency:

```javascript
uijet.Widget('KickAssList', {
    // methods and properties for KickAssList
}, {
    widgets: ['List'],
    mixins: ['Floated']
});
```

Now every `KickAssList` instance is automatically enhanced with the `Floated` Mixin.

Note that although `Floated` here is a dependency of `KickAssList`, it is still a Mixin enhancing
the Widget, so properties of `Floated` will override those of `KickAssList`.

### Declaring a view instance:

Second, declaring the Widget instance that will define the view registered into uijet:

```javascript
define([
    'uijet',
    'custom_widgets/KickAssList'
], function (uijet) {

    uijet.declare({
        type: 'KickAssList',
        config: {
            element: '#kewl_list'
        }
    });

});
```

Here the `KickAssList` is injected as a dependency to our `kewl_list` view.

### Starting a view instance:

Under the hood uijet creates an instance of the component created from your view declaration.
That declaration holds a Widget definition and the sum of all of its dependencies injected to it -
other Widgets, Mixins, Adapters.

uijet then calls the `init()` method of that instance, and it's good to go.

## Using Factories

uijet is all about reusing.
The `uijet.Widget()` lets you reuse a *class* (a __definition__) of a generic component. To reuse
an instance (a __declaration__) you use `uijet.Factory()`, as follows:

```javascript
uijet.Factory('TransitionedButton', {
    type: 'Button',
    config: {
        mixin: ['Transitioned'],
        cloak: true
    }
});
```

As you can see in the example above, `uijet.Factory()` is used similarly as `uijet.declare()`,
only difference is it only takes a single declaration object, and requires a `name` as first
argument.

## Ad-hoc starting a view:
 
uijet also has an imperative way to declare and start a view instance, using the
`uijet.start()` method.
This method takes the same arguments as `uijet.declare()`, and will both declare and start
the views declarations provided to it.

Since uijet also needs to check whether there are dependencies that needs to be loaded, this
starting process will happen asynchronously once all dependencies are loaded, or simply on
next task of the queue of the JS engine.
 
If you're sure that all dependencies for the declaration(s) you've provided to `uijet.start()`
are all already loaded you can provide it a second argument `true`, which will cause the
starting to happen immediately and synchronously.
