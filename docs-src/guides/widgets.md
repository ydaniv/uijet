# Using and Creating Widgets


In uijet, Widgets are declarations of generic and reusable UI components.

The basic __Widgets__ that come bundled with uijet are the most basic building blocks
for creating any type of UI component. uijet gives you the tools for both extending
them and composing them together to form any kind of UI component you can think of.

These are:

* Pane
* Button
* List
* Overlay

## Using Widgets

To use one of the above Widgets in your app you simply declare an instance of that Widget.
Example in a UI module file: 

`ui.js`

```javascript
define([
    'uijet_dir/uijet',
    'uijet_dir/widgets/List',
], function (uijet) {

    uijet.declare({
        type: 'List',
        config: {
            element: '#groovie_list'
        }
    });

});
```

In the above example we load `uijet` and use it to `declare()` an instance of a `List` Widget.

Once uijet starts it will create an instance of the `List` Widget and bind it
to the DOM element set in the `element` option.

The actual `List` component that will be created with the `id`: `groovie_list` is *injected* with
the `List` Widget and all its *dependencies*.

Note that `uiject.declare()` *does not return an instance* of the created component, rather it
*registers* it to the uijet *sandbox*.
The only way another component can communicate with it is via events.

## Using Composites

uijet also has __Composites__ bundled with it, which are higher level components
that are composed from 2 or more basic __Widgets__.

Some of uijet's Composites are:

* Modal
* Select
* Datepicker

```javascript
define([
    'uijet_dir/uijet',
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

The above example will create an instance of a `Modal` dialog with 2 buttons.

## Creating a component in uijet

Creating a component in uijet is comprised of the following steps:

### Defining a Widget "class"

Firstly, defining a Widget class:

```javascript
define([
    'uijet_dir/uijet',
    'uijet_dir/widgets/Base'
], function (uijet) {

    uijet.Widget('KickAssPane', {
        // methods and properties for KickAssPane
    });
});
```

We could also add a Widget dependency:

```javascript
define([
    'uijet_dir/uijet',
    'uijet_dir/widgets/List'
], function (uijet) {

    uijet.Widget('KickAssList', {
        // methods and properties for KickAssList
    }, 'List');
});
```

In the example above we defined a new `KickAssList` Widget that inherits from the basic `List`.

We could also add a Mixin dependency:

```javascript
define([
    'uijet_dir/uijet',
    'uijet_dir/widgets/List'
    'uijet_dir/mixins/Floated'
], function (uijet) {

    uijet.Widget('KickAssList', {
        // methods and properties for KickAssList
    }, {
        widget: 'List',
        mixins: ['Floated']
    });
});
```

Now every `KickAssList` instance is automatically enhanced with the `Floated` Mixin.

Note that although `Floated` here is a dependency of `KickAssList`, it is still a Mixin enhancing
the Widget, so properties of `Floated` will override those of `KickAssList`.

### Declaring a component instance:

Second, declaring the Widget instance that will represent the component registered into uijet:

```javascript
define([
    'uijet_dir/uijet',
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

Here the `KickAssList` is injected as a dependency to our `kewl_list` component.

### Starting a component instance:

Under the hood uijet creates an instance of the component created from your component declaration.
That declaration holds a Widget definition and the sum of all of its dependencies injected to it -
other Widgets, Mixins, Adapters.

uijet then calls the `init()` method of that instance, and it's good to go.

## Using Factories

uijet is all about reusing.

The `uijet.Widget()` lets you reuse a *class* (a __definition__) of a generic component. To reuse
a blueprint of an instance (a __declaration__) you use `uijet.Factory()`, as follows:

```javascript
define([
    'uijet_dir/uijet',
    'uijet_dir/widgets/Button',
    'uijet_dir/mixins/Transitioned'
], function (uijet) {

    uijet.Factory('TransitionedButton', {
        type: 'Button',
        config: {
            mixins: ['Transitioned'],
            cloak: true
        }
    });

    // Which is followed by the declaration:

    uijet.declare({
        factory: 'TransitionedButton',
        config : {
            element: '#some_button'
        }
    });
});
```

As you can see in the example above, `uijet.Factory()` is used similarly as `uijet.declare()`,
only difference is it can only take a single declaration object (not a list of objects), and requires a `name` as first
argument.

## Nesting components:

You can nest components in a declarative way. There are 3 ways in uijet for declaring components

## Ad-hoc starting a component:

*Before* uijet is initialized, all calls to `uijet.declare()` declare a component instance what will
later be initialized after uijet does.

*After* uijet is initialized, all calls to `uijet.declare()` (or its alias `uijet.start()`)
will declare and start a component instance ad-hoc. This call will return a `Promise` object
that will resolve once that instance and all its nested components have finished initializing.
