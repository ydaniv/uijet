# uijet Mixins

A Mixin in uijet is a container for a specific behavior which you can add
to a Widget.
Mixins are implemented in a generic way which keeps them agnostic on both ends:

1. To any Widget that may extend.
2. To any 3rd party library that may extend them, if required.

Some Mixins require an extra Adapter that hooks them to any required library.
Example:

* Scrolled

Some Mixins require an extra Module to be loaded. Example:

* Templated
* Transitioned

Others don't require any other additions. Example:

* Floated
* Toggled

## Implementation details

In uijet, Mixins extend the prototype chain of a widget's class. uijet puts
the Mixins' prototypes on top of the Widgets' prototypes.

So, for example, if you have a widget that is a ListX which extends List Widget,
and you extend it with Templated Mixin, the resulting prototype chain will be:

```javascript
{
    __proto__: /* Templated */ {
        __proto__: /* ListX */ {
            __proto__: /* List */ {
                //...
            }
        }
    }
}
```

This means that in Mixins you can always call `_super()` inside methods to invoke
the parent's method they override. That's why Mixins are great enhancing an
existing behavior of a Widget.

## Using Mixins

Mixins can be used in 2 ways:

1. In a widget instance declaration. This can be either a string or an array of strings.

```javascript
uijet.declare([{
        type: 'Pane',
        config: {
            element: '#main',
            mixins: ['Templated', 'Transitioned']
        }
    }, {
        type: 'Button',
        config: {
            element: '#accept',
            mixins: 'Toggled'
        }
    }]);
```

2. In a Widget definition's dependencies.

```javascript
uijet.Widget('GroovyPane', {
        appear  : function () {
            // do something
        }
    }, {
        mixins: 'Transitioned'
    });
```

Also here you can use both a string and an array of strings.

## Defining Mixins

You can define a new Mixin using the `uijet.Mixin()` method:

```javascript
uijet.Mixin('Debugged', {
    wake: function () {
        debugger;
        this._super.apply(this, arguments);
    }
});
```
