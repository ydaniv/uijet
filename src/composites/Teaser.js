(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base',
            'uijet_dir/widgets/List',
            'uijet_dir/mixins/Scrolled'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    var ANIMATION_PROPS = {
        slide   : {
            prop    : uijet.utils.getStyleProperty('transform'),
            value   : function (index) {
                var support_3d = uijet.support['3d'],
                    //TODO: cache slide_size since offsetWidth triggers reflow
                    slide_size = this.$slides.get(index).offsetWidth,
                    value = support_3d ? 'translate3d(-' : 'translate(-';
                return value + index * slide_size + 'px,0' + (support_3d ? ',0)' : ')');
            }
        }
    };
    uijet.Widget('Teaser', {
        options : {
            type_class: ['uijet_list','uijet_teaser']
        },
        last_index      : 0,
        slide_index     : 0,
        prepareElement  : function () {
            // duplicate this row from Base.prepareElement since preparing the slides requires the type classes set
            this.$element.addClass('uijet_widget ' + uijet.utils.toArray(this.options.type_class).join(' '));
            //TODO: replace this mechanism - won't work with more complex stuff or with simple fade in/out
            this.animation_type = uijet.utils.isObj(this.options.animation_type) ?
                this.options.animation_type :
                ANIMATION_PROPS[this.options.animation_type || uijet.options.animation_type];
            // set the CSS property to be used when animating the transition
            this.animation_prop = this.animation_type.prop;
            // if `cycle` option is `true` and this is not a templated instance
            if ( ! this.templated ) {
                this._prepareSlides();
            }
            this._super();
            return this;
        },
        register        : function () {
            var preview_options = {}, preview_user_ops, dfrds = [], $ = uijet.$;
            this._super();
            // Arrow Buttons
            if ( this.options.add_arrows ) {
                dfrds.push(uijet.start({ type: 'Button', config: uijet.utils.extend(true, {
                    element     : $('<span/>', {
                        'class' : 'uijet_teaser_arrow uijet_teaser_next',
                        id      : this.id + '_next'
                    }).appendTo(this.$wrapper),
                    container   : this.id
                }, this.options.next_options || {}) }), uijet.start({ type: 'Button', config: uijet.utils.extend(true, {
                    element     : $('<span/>', {
                        'class' : 'uijet_teaser_arrow uijet_teaser_prev',
                        id      : this.id + '_prev'
                    }).appendTo(this.$wrapper),
                    container   : this.id
                }, this.options.prev_options || {}) }));
                // init options.app_events
                this.options.app_events = {};
                // subscribe to prev/next click events
                this.subscribe(this.id + '_next.clicked', function () {
                        this._setTimeout(true)
                            .next();
                    })
                    .subscribe(this.id + '_prev.clicked', function () {
                        this._setTimeout(true)
                            .prev();
                    });
            }
            // Preview
            if ( this.options.add_preview ) {
                if ( uijet.utils.isObj(this.options.preview_options) ) {
                    preview_user_ops = this.options.preview_options;
                }
                preview_options.app_events = {};
                preview_options.app_events[this.id + '.next'] =
                    preview_user_ops && uijet.utils.isFunc(preview_user_ops.next) ?
                        preview_user_ops.next :
                        function () {

                        };
                preview_options.app_events[this.id + '.prev'] =
                    preview_user_ops && uijet.utils.isFunc(preview_user_ops.prev) ?
                        preview_user_ops.prev :
                        function () {

                        };
                preview_options = preview_user_ops ?
                    uijet.utils.extend(true, preview_options, preview_user_ops) :
                    preview_options;
                dfrds.push(uijet.start({ type: 'List', config: uijet.utils.extend(true, {
                        element     :  $('<ul/>', {
                            id  : this.id + '_preview'
                        }).appendTo(this.$wrapper)
                    }, preview_options)
                }));
            }
            this.dfrd_widgets = dfrds.length ? dfrds : [{}];
            return this;
        },
        next            : function () {
            this._setIndex(true);
            this.scrollTo();
            return this;
        },
        prev            : function () {
            this._setIndex(false);
            this.scrollTo();
            return this;
        },
        wake            : function () {
            var that = this,
                args = arguments,
                _super = this._super;
            return uijet.whenAll(this.dfrd_widgets).then(function () {
                _super.apply(that, args);
                that.last_index = 1;
                that.slide_index = 1;
                that._setTimeout(true);
            });
        },
        sleep           : function () {
            this.timeout && clearTimeout(this.timeout);
            this._super();
            return this;
        },
        render          : function () {
            if ( this.options.cycle && this.templated ) {
                return this._super()
                        .then(this._prepareSlides.bind(this));
            }
            return this._super();
        },
        scrollTo        : function () {
            var that = this,
                anim_props = {};
            anim_props[this.animation_prop] = uijet.utils.returnOf(this.animation_type.value, this, this.slide_index);
            this._fixPosition();
            this.$slides.removeClass('current')
                        .eq(this.slide_index).addClass('current');
            // cancel last animation if it's still in queue
            this.animation_id && uijet.utils.cancelAnimFrame(this.animation_id);
            this.animation_id = uijet.animate(
                this.$element,
                anim_props,
                function () {
                    that.last_index = that.slide_index;
                }
            );
            return this;
        },
        jumpTo          : function (index) {
            this.$element.removeClass('transitioned')[0].style[this.animation_prop] = uijet.utils.returnOf(this.animation_type.value, this, index);
            return this;
        },
        _setIndex       : function (next_prev) {
            var len = this.options.cycle ? this.slides_length + 2 : this.slides_length,
                step;
            if ( typeof next_prev === 'boolean' ) {
                step = this.slide_index + (next_prev ? 1 : -1);
                this.slide_index = this.options.cycle ?
                    step % len :
                    step < 0 ?
                        0 :
                        step >= len ?
                            len - 1 :
                            step;
            }
            return this;
        },
        _setTimeout     : function (reset) {
            var that = this,
                delay = this.options.delay;
            if ( delay ) {
                if ( reset && this.timeout ) {
                    clearTimeout(this.timeout);
                }
                this.timeout = setTimeout(function _next() {
                    that.next();
                    that.timeout = setTimeout(_next, delay * 1000);
                }, delay * 1000);
            }
            return this;
        },
        _fixPosition    : function () {
            var $dummy;
            if ( this.slide_index > this.slides_length ) {
                this.slide_index = 1;
                $dummy = this.$slides.eq(0).addClass('current immediate');
                this.jumpTo(0);
                $dummy.removeClass('immediate');
            } else if ( this.slide_index === 0 ) {
                this.slide_index = this.slides_length;
                $dummy = this.$slides.eq(this.slides_length + 1).addClass('current immediate');
                this.jumpTo(this.slides_length + 1);
                $dummy.removeClass('immediate');
            }
            return this;
        },
        _prepareSlides  : function () {
            var $slides = this.$element.children(),
                $first, $last;
            // clone first and last slides to support smooth transition from last to first and vice versa
            this.slides_length = $slides.length;
            if ( this.options.cycle ) {
                $first = $slides.eq(0);
                $last = $slides.eq(-1);
                // append the first and prepend the last
                this.$element.append($first.clone())
                    .prepend($last.clone());
                this.$slides = this.$element.children();
                // jump to the first slide
                this.jumpTo(1);
            } else {
                this.$slides = $slides;
                $first = $slides.eq(0);
            }
            $first.addClass('current');
        }
    }, {
        widgets : ['List'],
        mixins  : ['Scrolled']
    });
}));
