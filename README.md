# UIjet

Killer UI for web-apps.

[http://uijet.com](http://uijet.com)

## Description

UIjet provides the views layer for web applications via a separate sandbox.
It creates another layer of abstraction which allows you to create any UI widget you can think of
easily.

## Installation

Download the src folder and place in your project's static folder.

Implement the following methods using your libraries of choice:

* Custom events/Messaging

    * publish
    * subscribe
    * unsubscribe

And set the methods of the same name in the `methods` object of the configuration object you provide to `uijet.init`, like so:

    uijet.init({
        methods : {
            publish     : publish,
            subscribe   : subscribe,
            unsubscribe : unsubscribe
        }
    });

Optionally, if you are rendering templates on client-side in your app you can also implement the `generate` method by setting the `engine` option - here is an example using Mustache.js:

    //...uijet.init...
        engine  : function () {
            return Mustache.to_html(this.template, this.data || this.context);
        }

Another optional enhancement, if you need client-side routing in your app you can also implement the following:

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
After jQuery include your libraries of choice for custom events/messaging and, if needed, templating.
If you also need routing include the router library.
Include uijet.js followed by widgets/Base.js and the rest of the widgets you need afterwards.
If you require any mixins (or if they're required by any of the widgets you're using) include them after the widgets.
If you require any adapters include those too after the mixins along with each library they adapt to.


### Installation notes

UIjet makes only one layer in the application and depends on other integral components
that should reside within the application:

* Custom events/Messaging library
* [optional] Template engine
* [optional] URL router

UIjet is currently based on jQuery, mostly for DOM manipulation, client-server communication and its Promises API.
*There are plans to be either library agnostic or to have additional implementations which will not rely on jQuery.

## Dependencies

* jQuery>=1.6
* Custom events library of choice
* [optional] require.js
* [optional] Template engine of choice
* [optoinal] URL router of choice

## Usage

### Application startup

    var MyApp = (function () {
        // ...application code...
        
        // UIjet initialization
        uijet.init({
            methods : {
                // mandatory
                publish     : someEventsLib.publish,
                subscribe   : someEventsLib.subscribe,
                unsubscribte: someEventsLib.unsubscribe,
                // if using routes
                runRoute    : someRouter.runRoute,
                setRoute    : someRouter.setRoute,
                unsetRoute  : someRouter.unsetRoute
            },
            // if using templates
            engine  : function () {
                return someTemplateEnginge.render(this.template, this.data || this.context);
            }
            //...more options...
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
            type    : 'Pane',
            config  : {
                element : '#home_content_pane',
                mixins  : ['Templated'],
                data_url: '/home_content/',
                position: 'center',
                style   : {
                    padding : '3%'
                }
            }
        }, {
            type    : 'Pane',
            config  : {
                element         : '#alert_pane',
                mixins          : ['Templated', 'Transitioned'],
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