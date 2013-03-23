# UIjet

Killer UI for web-apps.

[http://uijet.com](http://uijet.com)

## Description

UIjet lets you create awesome, cross-platform web applications with rich UI and keeps your code maintainable.

It creates another layer of abstraction which allows you to create any UI widget you can think of
easily while you generate code of the highest level of quality.

## Quick start

Include uijet.css and themes/rhenium.css in your document's `head` tag.

### With AMD - using require.js

Include the require.js file at the bottom of your `<body>` tag.

#### Suggested configuration

Above it, open a `<script>` tag and in it include your require object.
Assuming you'll place all the 3rd party code under 'lib', it should look like:

    var require = {
        baseUrl : '/static_path/js/',
        paths   : {
            uijet_dir   : 'lib/uijet'
            // rest of needed paths ...
        },
        callback: function () {
            requirejs([
                'uijet',
                'uijet_dir/modules/pubsub/eventbox',
                'uijet_dir/modules/dom/jquery',
                'uijet_dir/modules/promises/jquery'
            ], function (uijet) {
                uijet.init();
            });
        }
    };

Where the *must have* configurations are:

* **baseUrl** - pointing to your base static folder.
* **paths** - you need to config the paths to *uijet_dir* - where your UIjet library is located.
* **callback** - to make sure everything works correctly it's best to use this option and put you initialization
call in there.

### Plugging in modules

To be able to use UIjet you must plug into it the following modules:
 
 * pubsub
 * promises
 * dom

You can simply add those module adapters from UIjet's modules library and activate them:

    // ...
    callback: function () {
        requirejs([
            'uijet',
            'uijet_dir/modules/pubsub/eventbox',
            'uijet_dir/modules/dom/jquery',
            'uijet_dir/modules/promises/jquery'
        ], function (uijet, Eventbox, $) {
            // init uijet
            uijet.init();
        });
    }
    // ...

The above modules are required for UIjet to work. The rest of the modules are optional.

### Without AMD

Include the libraries you are using with the modules (e.g. jQuery if using the dom/jquery module).
Include uijet.js followed by widgets/Base.js and the rest of the widgets you need afterwards.
If you require any mixins (or if they're required by any of the widgets you're using) include them after the widgets.
If you require any adapters include those too after the mixins along with each library they adapt to.


### Installation notes

UIjet makes only one layer in the application and depends on other integral components
that should reside within the application:

* Custom events/Messaging library
* Promises API library
* DOM wrapper library
* [optional] XMLHttpRequest/XHR2/CORS wrapper library
* [optional] Template engine
* [optional] URL router

__Note__: UIjet is not directly dependent on any other 3rd party code but also does not attempts to do anything that
others already do, and do it well. On the other hand, UIjet defines simple methods and conventions for hooking up any
3rd party library you need into it.

## Dependencies

* Custom events library of choice
* Promises API library of choice
* DOM API wrapping library of choice
* [optional] XHR wrapping library of choice
* [optional] Template engine of choice
* [optoinal] URL router of choice
* [optional] require.js

## Usage

### Application startup

    //TBD

### Widget instances definition

    //TBD

## Author

Yehonatan Daniv

## Special thanks

Venvid Technologies