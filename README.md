# uijet

Killer UI for web apps.

[http://uijet.com](http://uijet.com)

## In short

uijet lets you create awesome, cross-platform applications and keeps your code maintainable.

uijet helps you manage flow and state which are the main pain points of single-page applications.
It provides the tools for gluing together libraries of your choice, separating concerns,
decoupling components and composing them back together.

### Main emphasis

* Code quality and maintainability.
* DRY.
* Decouple everything.
* Event-driven.
* Complete portability of same codebase across different platforms.
* High performance and solid memory management.
* Reusable components.
* Scalable architecture.
* Declarative code, in JS (not just markup!)

## Srsly now, what's it all about

uijet allows you to create UI from a rapid prototype to a full-blown-large-scale application.

uijet performs 3 main roles:

* IoC container for your application that injects dependencies into your app and UI components.
* Glues all your favorite libraries with a consistent API which makes them easily swappable.
* Maintainable and scalable UI made of declarative, reusable, decoupled components. 

## Installing

* Download the source
* Or install via [npm](https://www.npmjs.com/):

```
> npm install uijet
```

* Or install via [Bower](http://bower.io/):

```
> bower install uijet
```

* Or install via [volo](http://volojs.org/):

```
> volo add uijet
```

__(recommended)__ If you're using an AMD module loader like [RequireJS](http://requirejs.org/) or [curl.js](https://github.com/cujojs/curl),
Great!

* Just define the path `uijet_dir` to be the path to where your uijet's `src` folder is located.
* Then `require()` `uijet.js` and the rest from there.

If you're NOT using an AMD module loader:

* Include the `uijet.js` script in your page.
    * If you're just starting with uijet, include the rest of the scripts under `src`.
    * If you know what you're doing, just grab what you need after it.

* __(recommended)__ Include the `uijet.css` in your page.

## Quick start

Checkout the application boilerplates in the `boilerplates` folder for a quick overview.

## Dependencies

uijet has no direct/hard dependencies, however:

 * It requires you (at least) install the tools you choose to fill the 3 roles listed bellow under __Required dependencies__.
 * It favors the use of an AMD module loader, like [RequireJS](http://requirejs.org/) or [curl.js](https://github.com/cujojs/curl).

The list of available module adapters is currently short, but you can easily create your own.
If you have created your own, do share! We'll be happy to hear about it.

### Required dependencies

For uijet to run you must include an adapter in your app from each of the following Modules:

 * pubsub
 * promises
 * dom

All the rest are completely up to you.

### Mandatory Modules' APIs

Although the dependency may be indirect, uijet does enforce a strict API that each Module adapter
must adhere to.
This requirement is a must for the top 3 Modules mentioned above, and a few other Mixins and Composites
which rely on other Modules.
The API enforcing is also what makes a Module swappable at any given point without any impact
on the underlying framework. In some cases even no impact at all, whatsoever, on your application.

*Example*: a dom Module adapter must be consistent with [jQuery](http://api.jquery.com/)'s API, so you
can choose either that, or [Zepto](http://zeptojs.com/), 
or with a little effort even [Bonzo](https://github.com/ded/bonzo) and [Bean](https://github.com/fat/bean).

## Concepts

### Modules

uijet embraces the principle of doing 1 thing and doing it right.

That's why it leaves the implementation of all the main parts of the application up
to external libraries, of your choice, and glues them together into a coherent interface
which allows them to be abstracted and easily swappable.

#### uijet.use

The entry point of adding a module into uijet.

### Widgets

These are the most basic building blocks for creating any type of UI component.
uijet gives you the tools for both extending them and composing them together to form
the components we all know and love.

#### uijet.Widget

Defines a class of a reusable component.

*Examples*: Pane, Button, List, etc.

#### uijet.Factory

Declares a blueprint for a factory of a component's instance.

#### uijet.declare

Declares an instance of a component in the app.

#### uijet.start

Initializes a component's instance(s), and registers it (them) into
uijet's sandbox.

### Composites

More comprehensive components which extends the basic, generic widgets and mixes them
into a single component.

This is usually done by providing `uijet.Wiget()` the third parameter which defines
dependencies for this component class.

*Examples*: Datepicker, Slider, Teaser, Modal, etc.

### Mixins & Adapters

Maintainability is all about deconstructing your code into small pieces
which perform a single main task, and then mixing them together.

Mixins are specifically for encapsulating behaviors for components, and
then enhance components with these behaviors as desired.

*Examples*: Toggled, Templated, Transitioned, etc.
 
Adapters are usually for adding missing behavior by acting as a mediator
to external libraries which implement that code, and abstract those libraries
with a consistent API.

In short, the main difference between Mixins and Adapters is that Mixins are only
aware of uijet, while Adapters may require and be aware of 3rd party API's.

*Example*: if you want a List component to be scrolled using a JS based plugin,
targeted for mouse wheel when used on desktop, and then with a different library,
targeted for touch gestures when used on handheld devices.

#### uijet.Mixin

Defines a Mixin that can be injected into components' classes.
Mixins are always injected on top of Widget dependencies and before the instance object.

#### uijet.Adapter

Defines an Adapter that can be injected onto a component's instances.
Adapters' properties are always copied to the instance object (the top of the prototype chain).

### Events & Signals

uijet component instances do not return a handle you can imperatively execute methods with, hence
the only way you can perform actions on components or achieve inter-component communication is via
registering handlers to events.

All handlers are always bound to the instance, so inside them you can use `this` as a handle to the instance.

#### Signals

Events triggered during a widget's lifecycle and provide an inner-component API.

Signals usually take the form of an AOP like handlers, e.g. `pre_methodname`, `post_methodname`.

#### DOM Events

The familiar DOM events triggered by user interaction.
These are always bound to the instance's `$element`.
uijet makes extensive use of event delegation and bounds by default only to widgets.
So, for example, in a List widget all click events on the child items are bound to the list
container and handled at that level.

#### App Events

Custom events for inter-component communication, or simply to publish events between different
modules, e.g. between the uijet sandbox and components, or a router and components.

## uijet.css

A baseline stylesheet that defines basic structure for widgets, basic behavior for mixins,
and some helper classes for managing the component's lifecycle.

uijet.css does very little style resetting that's more targeted for applications, rather then
simple content webpages.

It's recommended to complement it with [normalize.css](http://necolas.github.io/normalize.css/).

### Theming

Currently there are no bundled themes in uijet.
Hopefully, in the future there will be.

## Author

Yehonatan Daniv [@ydaniv](https://github.com/ydaniv/)

## Special thanks

Venvid Technologies

JetBrains, for their awesome IDE.
<br/>
<a href="http://www.jetbrains.com/pycharm/"><img src="http://www.jetbrains.com/img/logos/pycharm_logo.gif" width="250" alt="PyCharm logo"/></a>
