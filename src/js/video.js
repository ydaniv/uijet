(function (_window, $, undefined) {
    var Object = _window.Object,
        Array = _window.Array,
        toString = Object.prototype.toString,
        slice = Array.prototype.slice,
        Video = function () {
            this.options = {
                element         : '#video_container',
                video_data      : {},
                keys_control    : true,
                autoplay        : true,
                preload         : 'auto',
                controls        : true,
                keys_map        : {
                    39  : 'forward',
                    37  : 'backward',
                    38  : 'playRateUp',
                    40  : 'playRateDown',
                    32  : 'playPause',
                    77  : 'maximize'
                },
                on_init         : noop,
                on_play         : noop,
                on_pause        : noop,
                on_load         : noop,
                on_unload       : noop,
                on_ended        : noop,
                playback_rates  : [-10, -5, -2, -1, 1, 2, 5, 10]
            }
        };
    function noop() {}
    function isObj(obj) {
        return toString.call(obj) === '[object Object]';
    }
    function isElement(obj) {
        return ~ toString.call(obj).search(/\[object HTML[\w]+Element\]/);
    }
    function extend(target, source, deep) {
        var prop, _proto = Object.getPrototypeOf(source);
        if ( ! deep ) {
            for ( prop in source ) {
                if ( source.hasOwnProperty(prop) ) {
                    target[prop] = source[prop];
                }
            }
        } else {
            for ( prop in source ) {
                if ( source.hasOwnProperty(prop) ) {
                    if ( isObj(source[prop]) && isObj(target[prop]) ) {
                        target[prop] = extend(target[prop], source[prop], deep);
                        continue;
                    }
                    target[prop] = source[prop];
                }
            }
        }
        if ( _proto !== Object.prototype ) {
            extend(target, _proto, deep);
        }
        return target;
    }
    Video.prototype = {
        constructor             : Video,
        init                    : function (options) {
            this.setOptions(options)
                ._initVideo()
                ._registerEvents();
            return this;
        },
        destroy                 : function () {
            this._unregisterEvents()
                ._clearVideo()
                .$video.remove();
            this.$video = null;
            this.video = null;
            return this;
        },
        setSrc                  : function (url) {
            if ( this.$video ) {
                this.$video.attr('src', url || '').load();
            }
            return this;
        },
        playPause               : function (force_play) {
            var video = this.video;
            force_play === undefined ?
                video.paused ?
                    video.play() : this.options.can_pause && video.pause() :
                force_play ?
                    video.play() : this.options.can_pause && video.pause();
            return this;
        },
        setTime                 : function (time) {
            this.video.currentTime = time;
            return this;
        },
        seek                    : function (pointer) { // pointer = currentTime/duration
            var video = this.video;
            return this.setTime(pointer*video.duration);
        },
        safeSeek                : function (time) {
            var that;
            if ( this.video.seekable.length ) {
                this.setTime(time);
            } else {
                that = this;
                this.$video.one('durationchange', function () {
                    that.setTime(time);
                });
            }
            return this;
        },
        forward                 : function () {
            var video = this.video;
            this.seek(Math.min(parseInt(video.currentTime/video.duration*100,10) + 1, 100)/100); //add 1%
            return this;
        },
        backward                : function () {
            var video = this.video;
            this.seek(Math.max(parseInt(video.currentTime/video.duration*100,10) - 1, 0)/100); // subtract 1%
            return this;
        },
        playRateUp              : function () {
            var rates = this.options.playback_rates,
                rate = this.video.playbackRate,
                current_idx = rates.indexOf(rate);
            if ( current_idx != rates.length - 1 ) {
                rate = rates[current_idx + 1];
            }
            return this;
        },
        playRateDown            : function () {
            var rates = this.options.playback_rates,
                rate = this.video.playbackRate,
                current_idx = rates.indexOf(rate);
            if ( current_idx ) {
                rate = rates[current_idx - 1];
            }
            return this;
        },
        mute                    : function () {
            this.video.muted = !this.video.muted;
            return this
        },
        setOptions              : function (options) {
            extend(this.options, options, true);
            return this;
        },
        _clearVideo             : function () {
            this.setSrc('');
            return this;
        },
        _setContainer           : function () {
            var el = this.options.element;
            if ( typeof el === 'string' || isElement(el) ) {
                this.$container = $(el);
            } else if ( el.jquery && el.length ) {
                this.$container = el;
            }
            return this;
        },
        _initVideo              : function () {
            var attrs = {}, ops = this.options;
            if ( ops.controls ) { attrs.controls = 'controls'; }
            if ( ops.autoplay ) { attrs.autoplay = true; }
            if ( ops.preload ) { attrs.preload = ops.preload; }
            if ( ops.poster ) { attrs.poster = ops.poster; }

            this.$video = $('<video>', attrs);
            this.video = this.$video[0];
            this._setContainer();
            this.options.on_init.call(this);
            this.$video.appendTo(this.$container);

            if ( ops.src ) {
                this.setSrc(ops.src);
            }
            return this;
        },
        _registerEvents         : function () {
            var that = this,
                events = ['play', 'pause', 'ended'],
                i = 0, e;
//                keydownHandler = function (event) {
//                    var $this = $(this),
//                        method = that[that.options.keys_map[event.which]];
//                    if ( ! that.video ) { return; }
//                    $this.one('keyup.video', function () {
//                        $this.one('keydown.video', keydownHandler);
//                    });
//                    if ( method && typeof method == 'function' ) {
//                        event.preventDefault();
//                        method.call(that)
//                    }
//                };
//            if ( this.options.keys_control ) {
//                $(_window).one('keydown.video', keydownHandler);
//            }
            for ( ; e = events[i++] ; ) {
                this.$video.bind(e, this.options['on_' + e].bind(this));
            }
            return this;
        },
        _unregisterEvents       : function () {
            $(_window).unbind('.video');
            return this;
        },
        iOSToggle               : function (show) {
            if ( this.video ) {
                if ( show ) {
                    this.video.style['-webkit-transform'] = 'translate3d(0,0,0)';
                } else {
                    this.video.style['-webkit-transform'] = 'translate3d(-2048px,0,0)';
                }
            }
            return this;
        }
    };

    _window.Video = Video;
}(window, jQuery));