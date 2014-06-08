# Authoring an Application with uijet

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

Lets say you choose PubsubJS, When.js and Zepto:

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

