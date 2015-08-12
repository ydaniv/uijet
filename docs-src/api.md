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
* `activated` - `boolean`: If `true` this instance will be initially activated.

#### Overlay:

* `darken` - `boolean`: If `true` the `darken` class will be added to the instance element. In `uijet.css` this will add a black semi-transparent background color to the element.

#### List:

* `horizontal` - `boolean`: Setting this to `true` will affect layout and behavior of this element and its children to match a horizontal list.
* `initial` - `string|Element|Element[]`: Initial child of the instance element to `select()` after initialization.
* `item_selector`: Specifies a selector for item elements. Defaults to `'li'`.
* `click_target`: Specifies a selector for the `click` event target inside the item element. `click()`s will only be delegated from it and to the containing item element.
* `multiselect`: If `true` the instance will behave as a multiselect.
* `align`: Adds an extra class to the instance element prefixed by `'align_'`, for controlling items alignment.

<!--
#### Form:

* `change_exclude`: List of `name`s, or a function that returns it, of fields to exclude from `change` event delegation.
* `dont_focus`: If `true` disables default behavior of focusing the first `input` since `.focus()` is broken on some platforms.
* `error_selector`: Query selector for finding elements containing error messages and emptying them. Defaults to `.error`.
-->

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

* `bind_options` - `Object`: Configuration options to pass to the `rivets.bind()` call.
* `dont_bind` - `boolean`: If `true` then `rivets.bind()` will not be called automatically on instance initialization.

#### Animation modules:

* `transition` - `Object|string`: Depending on the specific module used, this option represents a directive for the transition animation to use.

#### Animation/Velocity module:

* `transition_reverse` - `Object|string`: Depending on the specific module used, this option represents a directive for the *reverse* (i.e. when the instance is `disappear()`ing) transition animation to use.

#### Animation/uijet-transit module:

* `dont_promote` - `boolean`: For advanced usage. If `true` makes sure that this component's element (or wrapper) is not promoted into its own layer (usually used for hardware acceleration).

#### Engine/lodash and Engine/underscore modules:

* `compile_options` - `Object`: Configuration options to pass to `_.template()`.

#### Router/Backbone module:

* `route_name` - `string`: Will be used for the `route` and `route:name` events triggered by the router and history. Defaults to the `widget.id`.

#### Search modules:

* `search` - `Object`: Configuration options for the `SearchIndex` instance.

#### Deferred:

* `promise` - `Promise|function`: Promise object, or a function that returns one, that once resolved invokes `wake()`. If it's a function it takes the `context` argument as param.

<!--
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
 -->

#### Floated:

* `float_position` - `string|Object|function`: A CSS text (`'<property>: <value>'`) to set on the floated element when it appears. For multiple properties use an `Object`.

#### Layered:

* `keep_layer_awake` - `boolean`: If `true` this instance will not be put to `.sleep()` when its sibling is `.awake()` and instead only put to the background.

<!--
#### Preloaded:

* `assets`: 
* `dont_preload`: 
* `preload_img_el`: 
-->

#### Routed:

* `route` - `string`: The route's path to be used for waking the instance.
* `alias_routes` - `string[]`: List of strings of alias paths for this instance's `route`.

#### Scrolled:

* `horizontal` - `boolean`: Set to `true` if the scroll is horizontal.
* `grid_layout` - `boolean`: When `true` will prevent stretching `this.$element` to contain its content, as done for a `horizontal` instance.

<!--
#### Submitted:

* `serializer`: 
* `validators`: 
* `submit_url`: 
* `route_submit`: 
* `submit_xhr_config`: 
-->

#### Templated:

* `template` - `string`: A raw template string to be used as the template for the instance. Do not use this option for putting a template string in your js source code! Only as an endpoint for hooking with loaded templates.
* `template_name` - `string`: If `template` is not set, this option will be used as the filename of the template to load. Defaults to `this.id>`. Used together with `uijet.options.templates_path` as prefix and `uijet.options.templates_extension` as suffix to create the path to the template.
* `partials` - `Object`: A map of partial names to their corresponding filename (or path). If the template and its partials are already fetched use the partials as values instead of paths.
* `partials_dir` - `string`: A common directory for looking up partials. This will be used together with `partials` to create the paths.
* `dont_auto_fetch_template` - `boolean`: When `true` templates will not be fetched automatically on `init()`.
* `insert_before` - `HTMLElement|string`: An element or a query selector to insert the rendered content before. By default content is appended to the end `this.$element`'s contents.
* `defer_images` - `boolean`: When `true` `this.$element` will be searched for images to preload and defer waking the instance after loading.

#### Dialog:

* `buttons` - `Object[]`: List of component declarations that will be created as children of this instance.

#### Modal:

* `buttons` - `Object[]`: List of component declarations that will be created as children of this instance.
* `underlay` - `Object`: Component declaration config overrides for the Overlay instance.
* `underlay_type` - `string`: The widget type to use for the Overlay instance. Defaults to `Overlay`.

#### DropmenuButton:

* `menu` - `Object`: Component declaration config overrides for the menu List instance.
* `menu_type` - `string`: The widget type to use for the menu instance. Defaults to `List`.
* `arrow` - `boolean|Object`: Component declaration config overrides for the arrow Button instance. If set to `true` then the default component will be created. Otherwise it will not be creaed at all.
* `arrow_type` - `string`: The widget type to use for the arrow button instance. Defaults to `Button`.
* `dont_close` - `boolean`: If `true` the menu will not be closed once an option is selected.

#### Select:

* `menu` - `Object`: Component declaration config overrides for the menu List instance.
* `menu_type` - `string`: The widget type to use for the menu instance. Defaults to `List`.
* `content` - `string|HTMLElement|HTMLElement[]`: An element or selector for the content element to use. Created by uijet by default.

#### Slider:

* `min` - `number`: Minimum possible value for the slider. Defaults to `0`.
* `max` - `number`: Maximum possible value for the slider. Defaults to `100`.
* `step` - `number`: Step to allow between possible values of the slider. Defaults to `1`.
* `handle` - `Object`: Component declaration config overrides for the handle Button instance.
* `handle_type` - `string`: The widget type to use for the handle button instance. Defaults to `Button`.
* `vertical` - `boolean`: If `true` this instance will be styled and behave as a vertical slider.
* `initial` - `number`: Initial value to use for instance. Defaults to `min` option.

#### Datepicker:

* `datelist` - `Object`: Component declaration config overrides for the date-list List instance.
* `datelist_type` - `string`: The widget type to use for the date-list instance. Defaults to `List`.
* `next` - `Object`: Component declaration config overrides for the next Button instance.
* `next_type` - `string`: The widget type to use for the next button instance. Defaults to `Button`.
* `prev` - `Object`: Component declaration config overrides for the prev Button instance.
* `prev_type` - `string`: The widget type to use for the prev button instance. Defaults to `Button`.
* `min_date` - `Date|string|number`: Minimum possible date for selection.
* `max_date` - `Date|string|number`: Maximum possible date for selection.
* `current_date` - `string|HTMLElement|HTMLElement[]`: element or selector for the element which will serve as the heading that contains current date.

### iScroll:

* `iscroll_options` - `Object`: Configuration options for the IScroll instance constructor.

### jqScroll:

* `jqscroll_options` - `Object`: Configuration options for the jqScroll instance constructor.

### jqScrollWheel:

* `jqscroll_options` - `Object`: Configuration options for the jqScroll instance constructor.

### Spin:

* `spinner_options` - `Object`: Configuration options for the spinner instance constructor.
