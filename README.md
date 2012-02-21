# UIjet

Generic and sandboxed GUI components for web apps.

[http://uijet.com](http://uijet.com)

## Description

UIjet provides the views layer for web applications via a separate sandbox.
It creates another layer of abstraction above HTML which allows you to create any UI widget you can think of
easily.

## Installation

Download the src folder and place in your project's static folder.

Implement the following methods using your libraries of choice:

* Custom events/Messaging

    * publish
    * subscribe
    * unsubscribe

* Template engine:

    * BaseWidget.generate

Optionally, if you need client-side routing in your app you can also implement the following:

* URL router:

    * setRoute
    * unsetRoute
    * runRoute

Include uijet.css in your document.

### With AMD - using require.js

Include the require.js file at the bottom of your `<body>` tag.

#### Suggested configuration

Above it, open a `<script>` tag and in it include your require object, like:

    var require = {
        baseUrl : '/static_path/js/',
        deps    : ['jquery'],
        paths   : {
            jquery      : 'lib/jquery-1.7.1.min',
            uijet_dir   : 'lib/uijet',
            plugins     : 'lib'
            // rest of needed paths ...
        },
        callback: function () {
            require(['jquery', 'my_app'], function ($, myApp) {
                myApp.init({
                    widgets : [/*
                        widgets declarations
                    */]
                });
            });
        }
    };

Where the *must have* configurations are:

* **baseUrl** - pointing to your base static folder.
* **deps** - must include at least 'jquery'.
* **paths** - you need to config the paths to *jquery*, *uijet_dir* - where your UIjet library is located - and 
third party plugins, which are adapted into UIjet, need to be conigured under the *plugins* key.
* **callback** - to make sure everything works correctly it's best to use this option and put you initialization
call in there.

### Without AMD

Include jQuery>= 1.6 in your document.
After jQuery include your libraries of choice for templating and custom events/messaging.
If you also need routing include the router library.
Include uijet.js followed by widgets/Base.js and the rest of the widgets you need afterwards.
If you require any mixins (or if they're required by any of the widgets you're using) include them after the widgets.
If you require any adapters include those at too after the mixins along with each library they adapt.


### Installation notes

UIjet makes only one layer in the application and depends on other integral components
that should reside within the application:

* Template engine
* Custom events/Messaging library
* [optional] URL router

UIjet is currently based on jQuery, mostly for DOM manipulation, client-server communication and its promises API.
*There are plans to be either library agnostic or to have additional implementations which will not rely on jQuery.

## Dependencies

* jQuery>=1.6
* Template engine of choice
* Custom events library of choice
* [optoinal] URL router of choice

## Usage

### Application startup

    var MyApp = (function () {
        uijet.publish = someEventsLib.publish;
        uijet.subscribe = someEventsLib.subscribe;
        uijet.unsubscribe = someEventsLib.unsubscribe;

        uijet.runRoute = someUrlRouter.runRoute;
        uijet.setRoute = someUrlRouter.setRoute;

        uijet.BaseWidget.generate = someTemplateEnginge.render;

        $(function () {
            uijet.init({
                //...options...
            });
        });
    }());

### Widget instances definition

    uijet.init({
        templates_path  : '/path/to/templates/',
        widgets         : [{
            type    : 'View',
            config  : {
                element : '#my_first_view',
                route   : '#/home/'
            }
        }, {
            type    : 'ContentPane',
            config  : {
                element : '#home_content_pane',
                data_url: '/home_content/',
                position: 'center',
                style   : {
                    padding : '3%'
                }
            }
        }, {
            type    : 'ContentPane',
            config  : {
                element         : '#alert_pane',
                mixins          : 'Transitioned',
                position        : 'center',
                animation_type  : 'appear',
                insert_before   : '#alert_close',
                signals         : {
                    post_disappear  : function () {
                        this.publish('close');
                    }
                },
                app_events      : {
                    'alert_close.clicked'   : function () {
                        this.sleep();
                    }
                }
            }
        }, {
            type    : 'Button',
            config  : {
                element : '#alert_close'
            }
        }]
    });

## Author

Yehonatan Daniv

## Special thanks

Venvid Technologies