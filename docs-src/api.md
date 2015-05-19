# uijet

## Killer UI for web apps.

__Note:__ Every module documented here is supported. All others are considered pending for addition/removal.

### Config Options Reference

* All `boolean`'s default to a falsy value (`undefined`).
* All `function`'s are invoked in the context of the instance. Meaning `this` is always the instance.

#### BaseWidget:

* `element` - `string|Element|Element[]|function`: the DOM element to tie this instance to as either a selector, an element, a wrapped element, or a function returning one of the above.
* `id` - `string|function`: the id of this instance, either as a string or a function that returns one. Defaults to the element's id, otherwise, one is automatically generated.
* `container` - `string`: the id of the widget containing this instance. Defaults to traversing the DOM and finding the first parent with a `uijet_widget` class. If reached the `body` tag it will be a top-level widget.
* `dont_wake` - `boolean|function`: if `true` this instance will not be awaken automatically when its container widget awakes. The `function` is passed the `context` object as argument.
* `cloak` - `boolean`: if `true` this instance element's `visibility` will be set to `hidden` whenever its `disappear()` method (and of course `sleep()`) is called.
* `hide` - `boolean`: if `true` this instance's element will receive the `hide` class - setting its `display` to `none` whenever its `disappear()` method (and of course `sleep()`) is called. This takes precedence over `cloak`.
* `bind_on_wake` - `boolean`: if `true` `dom_events` will be bound on every `wake()` and unbound on every `sleep()`. Otherwise they will be bound once on `init()`.
* `components` - `Array|function`: list of widget declarations to instantiate as child components of the instance.
* `type_class` - `string|Array`: list of class names to use on the instance's element and wrapper which define its type. Usually defined in the widget class definition.
* `extra_class` - `string`: extra classes to set on the instance element.
* `dont_wrap` - `boolean`: if `true` the instance element will never be wrapped in another element (wrapper) in cases where this is usually performed. In such case `this.$wrapper` is set to `this.$element`.
* `wrapper_tag` - `string`: the tag name of the element to use for wrapping. Defaults to `'div'`.
* `wrapper_class` - `string`: extra classes to set on the wrapper element.
* `position` - `string|Object|function`: used to position the instance. Usually handy for rapid prototyping, otherwise use plain CSS.
* `style` - `Object|function`: used for styling the instance's wrapper element. Usually handy for rapid prototyping or setting dynamic styles, otherwise use plain CSS.
* `signals` - `Object`: a map of signal names to handlers. A handler can either be a `function` or a `string`.
* `app_events` - `Object`: a map of event names to handlers. A handler can either be a `function` or a `string`.
* `dom_events` - `Object`: a map of DOM event names - and optionally a delegate target separated by a space - to handlers. A handler can either be a `function` or a `string`.
* `wake_on_startup` - `boolean`: if `true` the instance's `wake()` method is bound to the `startup` event triggered when uijet initializes.
* `sync` - `boolean`: when `true` a successful starting sequence will only begin once all promises returned by `wake()` calls of all child components are resolved. Otherwise, will start immediately.
* `destroy_on_sleep` - `boolean`: if `true` the instance's `destroy()` method is called when its `sleep()` method is called.
* `click_event` - `string`: the event type to use for binding `click()` and `select()` methods.

#### Button:

* `prevent_default` - `boolean`: If `true` `preventDefault()` of the `click` event will be called.
* `disabled` - `boolean`: If `true` this instance will be initially disabled.

#### Overlay:

* `darken` - `boolean`: If `true` the `darken` class will be added to the instance element. In `uijet.css` this will add a black semi-transparent background color to the element.

#### List:

* `horizontal` - `boolean`: Setting this to `true` will affect layout and behavior of this element and its children to match a horizontal list.
* `initial` - `string|Element|Element[]`: Initial child of the instance element to `select()` after initialization.
* `item_selector`: Specifies a selector for item elements. Defaults to `'li'`.
* `click_target`: Specifies a selector for the `click` event target inside the item element. `click()`s will only be delegated from it and to the containing item element.
* `multiselect`: If `true` the instance will behave as a multiselect.
* `align`: Adds an extra class to the instance element prefixed by `'align_'`, for controlling items alignment.

#### Form:

* `change_exclude`: List of `name`s, or a function that returns it, of fields to exclude from `change` event delegation.
* `dont_focus`: If `true` disables default behavior of focusing the first `input` since `.focus()` is broken on some platforms.
* `error_selector`: Query selector for finding elements containing error messages and emptying them. Defaults to `.error`.

#### Data modules:

* `resource` - `string|Object`: Sets the instance's `resource` to the given object. If a `string` is used uijet will lazily set it to a registered resource with the same name on instance initialization.
* `resource_name` - `string`: A key to use when referencing the model's attributes form the `context` object. Defaults to the `resource` option if it's a `string`, otherwise to `'<this.id>_data'`.
* `dont_merge_resource` - `boolean`: Whether to merge the model's attributes to the `context` object or just reference it from there using `resource_name`.
* `data_events` - `Object`: a map of event names to handlers. A handler can either be a `function` or a `string`, depending on the specific module.
* `dont_bind_data_events` - `boolean`: If `true` the component will not bind its `data_events`, which by default is done on initialization.

#### Data/Backbone module

* `destroy_resource` - `boolean`: If `true`, when `destroy()`ing the component it will also call `destroy()` in its `resource`.
* `dont_remove_resource` - `boolean`: Unless `true`, if the component's `resource` is a `Model` in a `Collection` it will be removed once the component is `destroy()`ed.
* `sorting` - `Object`: Map of predefined `comparator` functions/strings that can be used to sort the resource.

#### Binding modules:

* `observe` - `Object|string`: Map of object names in the templates to resources or names of resources registered with uijet. If the a value is either `'this'` or `true` it will be mapped to the instance's `context`. If a `string` is used then the `context` will be mapped to that name in the template.

#### Binding/Rivets and Binding/Rivets-Backbone modules:

* `bind_options` - `Object`: 
* `dont_bind` - `boolean`: 

#### Animation modules:

* `transition` - `Object|string`: Depending on the specific module used, this option represents a directive for the transition animation to use.

#### Animation/Velocity module:

* `transition_reverse` - `Object|string`: Depending on the specific module used, this option represents a directive for the *reverse* (i.e. when the instance is `disappear()`ing) transition animation to use.

#### Animation/uijet-transit module:

* `dont_promote` - `boolean`: For advanced usage. If `true` makes sure that this component's element (or wrapper) is not promoted into its own layer (usually used for hardware acceleration).

#### Engine modules:

* `template` - `string`: .

#### Router/Backbone module:

* `route_name` - `string`: 

#### Search modules:

* `search`: 

#### Deferred:

* `promise`: 

#### Dragged:

* `dont_translate`: 
* `keep_position`: 
* `dont_auto_drag`: 
* `drag_axis`: 
* `drag_delay`: 
* `drag_clone`: 
* `drag_parent`: 
* `drag_once`: 
* `drag_contain`: 
* `drag_element`: 

#### Floated:

* `float_position`: 

#### Layered:

* `keep_layer_awake`: 
* `state`: 

#### Preloaded:

* `assets`: 
* `dont_preload`: 
* `preload_img_el`: 

#### Routed:

* `route`: 
* `alias_routes`: 

#### Scrolled:

* `grid_layout`: 

#### Submitted:

* `serializer`: 
* `validators`: 
* `submit_url`: 
* `route_submit`: 
* `submit_xhr_config`: 

#### Templated:

* `template_name`: 
* `partials`: 
* `partials_dir`: 
* `dont_auto_fetch_template`: 
* `insert_before`: 
* `defer_images`:

#### Dialog:

* `buttons`: 

#### Modal:

* `buttons`: 
* `underlay`: 

#### DropmenuButton:

* `menu`: 
* `arrow`: 
* `dont_close`: 

#### Select:

* `menu`: 
* `content`: 

#### Slider:

* `min`: 
* `max`: 
* `step`: 
* `handle`: 
* `vertical`: 
* `initial`: 

#### Datepicker:

* `min_date`: 
* `max_date`: 

### iScroll:

* `iscroll_options`:

### jqScroll:

* `jqscroll_options`: 

### jqScrollWheel:

* `jqscroll_options`: 

### Spin:

* `spinner_options`: 
