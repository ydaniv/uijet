# uijet

Killer UI for web-apps.

[http://uijet.com](http://uijet.com)

## In short

uijet lets you create awesome, cross-platform applications and keeps your code maintainable.

uijet creates another layer of abstraction allowing you to focus 
on flow of your application's logic while you generate code of the highest quality.

### Main emphasis

* Event-driven.
* Decouple everything.
* Re-use everything. Especially external libraries.
* Code quality and maintainability that scale.
* Complete portability of same codebase across different platforms.
* High performance and solid memory management.
* Scalable architecture.
* Reusable components
* Declarative code, in JS (not just markup!)

## Srsly now, what's it all about

uijet allows you to create UIs for from rapid prototypes to full-blown-large-scale applications.
uijet performs 3 main roles:

* IoC container for your application, and injects dependencies into your app and UI components.
* Glues all your favorite libraries with a consistent API which makes them easily swappable.
* Maintainable and scalable UI made of declarative, reusable, decoupled components. 

## Concepts

### Modules

uijet embraces the principle of doing 1 thing (or at most 2) and doing it right.

That's why it leaves all of the implementation of all the main parts of the application up 
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

Initializes a component's instance(s).

#### uijet.register

Registers the component into uijet's sandbox.
This method is invoked by the Base widget's `register()` method, 
so you usually don't have to call it from your code.

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

    //TBD

## uijet.css

    //TBD

### Theming

    //TBD

## Quick start

Grab the a boilerplate from `boilerplates` and open `index.html` in your browser.

## Dependencies

uijet has no direct dependencies, however:

 * It favors the use of an AMD module loader, like [RequireJS](http://requirejs.org/) or [curl.js](https://github.com/cujojs/curl).
 * The list of available module adapters is currently short, but you can easily create your own.

### Required dependencies

For uijet to run you must include an adapter in your app from each of the following Modules:

 * pubsub
 * promises
 * dom

All the rest are completely up to you.

### Mandatory Modules' APIs

Although the dependency may be indirect, uijet does enforce a strict API that each Module adapter 
must adhere to.
This requirement is a must for the top 3 Modules mentioned above, and a few other Mixins and Composites, 
which rely on other Modules.
The API enforcing is also what makes a Module swappable at any given point without any impact 
on the on the underlying framework. On some cases even no impact at all, whatsoever, on your application.

*Example*: a dom Module adapter must be consistent with [jQuery](http://api.jquery.com/)'s API, so you
can choose either that, or [Zepto](http://zeptojs.com/), 
or with a little effort even [Bonzo](https://github.com/ded/bonzo) and [Bean](https://github.com/fat/bean).

## Usage

    //TBD

### Application startup

    //TBD

### Widget instances definition

    //TBD

## Author

Yehonatan Daniv

## Special thanks

Venvid Technologies

JetBrains, for their awesome IDE.
<img src="http://www.jetbrains.com/img/logos/pycharm_logo.gif" width="250"/>
