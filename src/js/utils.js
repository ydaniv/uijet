(function (_window, undefined) {

    var Function = _window.Function,
        Object = _window.Object,
        objToString = Object.prototype.toString,
        arraySlice = _window.Array.prototype.slice;

    if ( typeof Function.bind != 'function' ) {
        Function.prototype.bind = function (scope) {
            var _self = this;
            return function () {
                return _self.apply(scope, arguments);
            };
        };
    }
    function isObj(obj) {
        return objToString.call(obj) == '[object Object]';
    }

    function isArr(obj) {
        return objToString.call(obj) == '[object Array]';
    }

    function extend() {
        var args = arraySlice.call(arguments),
            target = args.shift(),
            source,
            is_deep,
            l, s;
        if ( typeof target == 'boolean' ) {
            is_deep = target;
            target = args.shift();
        }
        l = args.length;
        while ( source = args.shift(), l-- ) {
            if ( is_deep ) {
                for ( s in source ) {
                    if ( isObj(source[s]) && isObj(target[s]) ) {
                        target[s] = extend(true, {}, target[s], source[s]);
                    } else {
                        target[s] = source[s];
                    }
                }
            } else {
                for ( s in source ) {
                    target[s] = source[s];
                }
            }
        }
        return target;
    }

    function Create(proto, _extends, as_constructor) {
        function F() {}
        if ( typeof _extends == 'boolean' ) {
            as_constructor = _extends; _extends = null;
        }
        if ( _extends ) {
            proto = extend(
                Object.create(typeof _extends == 'function' ? _extends.prototype : _extends),
                typeof proto == 'function' ? proto.prototype : proto
            );
        }
        F.prototype = proto;
        return as_constructor ? F : new F();
    }

    _window._$ = {
        extend      : extend,
        Create      : Create,
        isObj       : isObj,
        isArr       : isArr
    }
}(window));