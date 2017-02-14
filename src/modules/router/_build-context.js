(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        return factory(root.uijet);
    }
}(this, function (uijet) {

    return uijet.use({
        /**
         * Builds a context object from the returned arguments of a route.
         * Named parameters in `route` are indexed in the context object by name.
         *
         * Also supports splat params using the prefix `'*'`.
         *
         * @memberOf uijet
         * @param {string} route - The route string to analyze.
         * @param {*} [args_array] - The list of arguments sent to a route's callback.
         * @returns {Object} Context object generated for the route.
         * @private
         */
        _buildContext        : function (route, args_array) {
            var context = {},
            // matches anything that contains ':' followed by a name
                named_arg_re = /.*:([-\w]+)/,
                parts = route.replace(/\(|\)/g, '').split('/'),
                i = 0, n = 0,
                part, match, splat_parts;

            // make sure `args_array` is an `Array`
            args_array = uijet.utils.toArray(args_array) || [];

            // make sure we don't stop looping because of leading '/'
            while ( part = parts[i++], typeof part == 'string' ) {
                // if it's a named argument
                if ( match = part.match(named_arg_re) ) {
                    // then add it to the context by name
                    context[match[1]] = args_array.shift();
                    n += 1;
                }
                else if ( part[0] == '*' ) {
                    splat_parts = args_array.shift().split('/');
                    while ( part = splat_parts.shift() ) {
                        context[n] = part;
                        n += 1;
                    }
                }
            }
            return context;
        }
    });
}));
