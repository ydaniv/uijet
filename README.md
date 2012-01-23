# UIjet

Generic and sandboxed GUI components for web apps.

[http://uijet.com](http://uijet.com)

## Description

UIjet provides the views layer for web applications via a separate sandbox.

## Installation

Download the src folder and place in your project's static folder.

Implement the following methods using your libraries of choice:

* Custom events/Messaging

    * publish
    * subscribe
    * unsubscribe

* URL router:

    * setRoute
    * runRoute

* Template engine:

    * BaseWidget.generate

Include uijet.css in your document.
Include jQuery>= 1.6 in your document.
After jQuery include your libraries of choice for templating, URL routing and custom events/messaging.
Include uijet.js followed by widgets/base.js and the rest of the widgets you need afterwards.
If you require any mixins (or if they're required by any of the widgets you're using) include them after the widgets.
If you require any adapters include those at too after the mixins along with each library they adapt.


### Installation notes

UIjet makes only one layer in the application and depends on other integral components
that should reside within the application:

* URL router
* Custom events/Messaging library
* Template engine

UIjet is currently based on jQuery, mostly for DOM manipulation, client-server communication and its promises API.
*There are plans to be either library agnostic or to have additional implementations which will not rely on jQuery.

## Dependencies

* jQuery>=1.6
* Template engine of choice
* URL router of choice
* Custom events library of choice

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