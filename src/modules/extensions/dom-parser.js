(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet'], function (uijet) {
            return factory(root, uijet);
        });
    } else {
        factory(root, root.uijet);
    }
}(this, function (root, uijet) {

    var TYPE_ATTR = 'data-uijet-type',
        ATTR_PREFIX = 'data-uijet-',
        attr_prefix_re = RegExp('^' + ATTR_PREFIX + '([-_\\w]+)');

    // ### utils.mapAttributes
    // utility for iterating over an attributes list, picking those that begin with `data-uijet-`
    // and returns a map of the name - without the prefix - to the value OR `true` if empty
    function mapAttributes (attrs_list) {
        var obj = {};
        Array.prototype.forEach.call(attrs_list, function (attr) {
            if ( ~ attr.name.search(attr_prefix_re) ) {
                obj[attr.name.match(attr_prefix_re)[1]] = attr.value === '' ? true : attr.value;
            }
        });
        return obj;
    }

    uijet.use({
        // ## uijet.parse
        // @sign: parse()  
        // @return: uijet
        //
        // Searches the DOM, starting from the container element, for all widget definitions inside the markup
        // and starts these widgets.  
        // This method looks for the `data-uijet-type` attribute on tags.
        parse               : function (dfrd) {
            var that = this, $ = this.$;
            this.$element.find('[' + TYPE_ATTR + ']')
                .each(function () {
                    var $this = $(this),
                        _type = $this.attr(TYPE_ATTR),
                        _widget = { type : _type, config : that.parseWidget($this) };
                    uijet.initialized ?
                        uijet.start(_widget) :
                        uijet.declare(_widget);
                });
            ! this.initialized && dfrd && dfrd.resolve();
            return this;
        },
        // ## uijet._parseScripts
        // @sign: _parseScripts($element, config)  
        // @return: uijet
        //
        // Looks for script tags inside the widget's element, given as a jQuery object in `$element`,
        // parses their attributes and `innerHTML` and adds them as widget options on the given `config` object.  
        // Looks for the `type` attribute to specify the type of option to be set.  
        // If the option is an event then it looks for a `data-uijet-event` attribute which specifies the type
        // of the event to be listened to.  
        // For arguments passed to the event handler it looks for a `data-uijet-args` attribute, which is a list
        // of argument names separated by ','.  
        // The body of the tag is used as the function body.  
        // Example markup:
        //
        //      <div id="my_list" data-uijet-type="List">
        //          <script type="uijet/app_event"
        //                  data-uijet-event="my_list_container_pane.post_wake"
        //                  data-uijet-args="event, data">
        //              this.wake(data);
        //          </script>
        //      </div>
        _parseScripts       : function ($el, config) {
            var F = root.Function, $ = this.$;
            $el.find('script').each(function () {
                var $this = $(this),
                    type = $this.attr('type'),
                    // get attributes and normalize it into an `Array`, their names and `Boolean` values
                    attrs = mapAttributes($this[0].attributes),
                    // extract the option name from the type
                    option_name = type.match(/uijet\/(\w+)/),
                    _fn_args, fn;
                    // get the `string` from the matches if got any
                option_name = option_name ? option_name[1] : '';
                // if we have an `args` attribute split it to an `Array` and trim their names
                _fn_args = attrs.args && attrs.args.length ? attrs.args.split(/\s*,\s*/) : [];
                // add function body
                _fn_args.push(this.innerHTML);
                // create the function
                fn = F.apply(null, _fn_args);
                // set it as an option on the `config` object
                switch ( type ) {
                    case 'uijet/signal':
                    case 'uijet/app_event':
                    case 'uijet/dom_event':
                        option_name = option_name + 's';
                        config[option_name] = config[option_name] || {};
                        config[option_name][attrs.event] = fn;
                        break;
                    case 'uijet/initial':
                    case 'uijet/serializer':
                    case 'uijet/style':
                    case 'uijet/position':
                    case 'uijet/data_url':
                    case 'uijet/submit_url':
                    case 'uijet/routing':
                        config[option_name] = fn;
                        break;
                }
                // clean the DOM
                $this.remove();
            });
            return this;
        },
        // ## uijet.parseWidget
        // @sign: parseWidget($element)  
        // @return: config
        //
        // Parses a widget's configuration from the DOM.  
        // Takes a jQuery object containing the widget's element and parses its attributes and inner script tags.  
        // For complete compliance with HTML5 and non-conflict approach it parses only attributes
        // prefixed with `data-uijet-`. The name of the attribute following this prefix is the same
        // as option it matches.  
        // For boolean options that are equal `true` you can simply use the name of that attribute with no value,
        // example:
        //
        //      <div data-uijet-type="List" data-uijet-horizontal>...</div>
        //
        // Returns a config object to be used in `uijet.start()` call.  
        // For options with function as a value read the `uijet._parseScripts` docs.
        parseWidget         : function ($el) {
            var attrs = mapAttributes($el[0].attributes),
                _ops_string = attrs['config'],
                _config;
            if ( _ops_string ) {
                delete attrs['config'];
                try {
                    _config = JSON.parse(_ops_string);
                } catch (e) {}
                uijet.utils.extend(attrs, _config);
            }
            this._parseScripts($el, attrs);
            attrs['element'] = $el;
            return attrs;
        }
    });

    // add an init task to parse the DOM for widgets
    uijet.init_queue.push(function (dfrd) {
        this.parse(dfrd);
        return dfrd.promise();
    });

}));
