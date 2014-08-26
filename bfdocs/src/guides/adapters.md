# uijet Adapters

Adapters are objects (or in fact mixins) that extend Widget instances.
uijet Adapters are mostly used as [adapter objects](http://en.wikipedia.org/wiki/Adapter_pattern) for hooking
3rd party libraries' interface with the interface uijet expects.

Examples:

* iScroll
* Spin

Adapters can also be used for creating [controllers](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller).

## Implementation details

In uijet, Adapters augment the object of a widget's instance. uijet copies
the Adapter's properties directly on the instance.

You can call `_super()` inside methods to invoke the parent's method they override.

## Using Adapters

Use Adapters when you want to add specific logic - as opposed to generic - 
usually when as an adapter to an external API. That could be your remote backend API
or a 3rd party library.

## Defining Adapters

You can define a new Adapter using the `uijet.Adapter()` method:

```javascript
uijet.Adapter('Console', {
    log: function () {
        console.log.apply(console, arguments);
    },
    trace: function () {
        console.trace();
    }
});
```

## Loading Adapters

If you're using an AMD loader then uijet will load its bundled Adapters automatically.
If you define your own Adapter make sure it's loaded before it's used.
