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

    function isFunc(obj) {
        return typeof obj == 'function';
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

    function extendProto() {
        var args = arraySlice.call(arguments),
            target = args.shift(),
            source,
            l, s;
        l = args.length;
        while ( source = args.shift(), l-- ) {
            for ( s in source ) {
                if ( isFunc(source[s]) && isFunc(target[s]) ) {
                    target[s] = (function (_super, _self) {
                        return function () {
                            var tmp = this._super, ret;
                            this._super = _super;
                            ret = _self.apply(this, arguments);
                            this._super = tmp;
                            return ret;
                        };
                    }(target[s], source[s]));
                } else if ( isObj(source[s]) && isObj(target[s]) ) {
                    target[s] = extend(true, {}, target[s], source[s]);
                } else {
                    target[s] = source[s];
                }
            }
        }
        return target;
    }

    function Create(proto, _extends, as_constructor) {
        var _proto = isFunc(proto) ? proto.prototype : proto;
        function F() {}
        if ( typeof _extends == 'boolean' ) {
            as_constructor = _extends; _extends = null;
        }
        if ( _extends ) {
            _proto = extendProto(
                Object.create(isFunc(_extends) ? _extends.prototype : _extends),
                _proto
            );
        }
        F.prototype = _proto;
        return as_constructor ? F : new F();
    }

    _window._$ = {
        extend      : extend,
        extendProto : extendProto,
        Create      : Create,
        isObj       : isObj,
        isArr       : isArr
    }
}(window));
