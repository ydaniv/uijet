uijet.Widget('Video', {
    options : {
        type_class          : 'uijet_video'
    },
    wake                    : function (context) {
        var that = this, dfrd;
        this.notify.call(this, 'pre_wake', arguments);
        this._setContext.apply(this, arguments);
        this.dfrd = $.Deferred();
        dfrd = this.wakeContained(context);
        $.when.apply($, dfrd).then(function () {
            $.when( that.update() ).then(function () {
                $.when ( that.render() ).then(function () {
                    that.bind()
                        .initPlayer()
                        .appear(context)
                        .awake = true;
                    that.notify('post_wake');
                    that.dfrd.resolve();
                });
            });
        });
        return this.dfrd.promise();
    },
    sleep           : function () {
        this.unbind();
        this.disappear()
            .destroyVideo()
            .sleepContained()
            .awake = false;
        this.options.destroy_on_sleep && this.destroy();
        return this;
    },
    next                    : function () {
        this.data.media.length && this.options.can_zap && this._zapNext();
        return this;
    },
    prev                    : function () {
        this.data.media.length && this.options.can_zap && this._zapPrev();
        return this;
    },
    setPoster              : function (src) {
        if ( this.$current_poster && this.$current_poster.length ) this.$current_poster.remove();
        this.hideVideo(true);
        return this.$current_poster = $('<div/>', {
            className   : 'media_playlist_image',
            style       : 'background:url(' + src + ') center center no-repeat;'
        }).appendTo(this.$container);
    },
    removePoster           : function () {
        this.$current_poster && this.$current_poster.remove();
        this.hideVideo(false);
        return this;
    },
    initPlayer              : function () {
        var item, data = this.data.media;
        if ( data.length ) {
            item = data[0];
            this.initVideo()
                ._addItem(item)
                ._registerNextListener(item)
                .current_playing = 0;
        }
        return this;
    },
    _zapPrev                : function () {
        var data;
        this.current_playing = (this.current_playing ? this.current_playing : this.data.media.length) - 1;
        data = this.data.media[this.current_playing];
        if ( ! data ) { return this._zapPrev(); }
        this._removeCurrentItem();
        if ( data.itype === 'video' ) {
            this._addItem(data)
                ._registerNextListener(data)
                .play();
        } else {
             return this._zapPrev();
        }
        return this;
    },
    _zapNext                : function () {
        var data;
        this.current_playing = this.current_playing === this.data.media.length - 1 ? 0 : this.current_playing + 1;
        data = this.data.media[this.current_playing];
        if ( ! data ) { return this._zapNext(); }
        this._removeCurrentItem();
        if ( data.itype === 'video' ) {
            this._addItem(data)
                ._registerNextListener(data)
                .play();
        } else {
            return this._zapNext();
        }
        return this;
    },
    _addItem                : function (item) {
        switch ( item.itype ) {
            case 'image':
                this.current_item = this.setPoster(item.link);
                this.current_item_type = 'image';
                break;
            case 'video':
            default:
                this.current_item_type = 'video';
                this.setItem(item.link);
                if ( item.start > 0 ) this.seek(item.start);
                this.maximize()
                    .notify('pre_load', this.data);
                break;
        }
        return this;
    },
    _removeCurrentItem      : function () {
        switch( this.current_item_type ) {
            case 'image':
                this.removePoster();
                break;
            case 'video':
            default:
                this.setItem('');
                this.notify('post_unload');
                break;
        }
        return this;
    },
    _registerNextListener   : function (item) {
        var _handler = this._handleListNext.bind(this);
        switch ( item.itype ) {
            case 'image':
                if ( item.duration ) {
                    this._timeout = setTimeout(_handler, item.duration);
                }
                break;
            case 'video':
            default:
                // TODO: remove direct use of $video
//                this.$video.one('ended', _handler);
                break;
        }
        return this;
    },
    // TODO: This is ugly and not tested, needs a re-write
    _handleListNext         : function (event) {
        var data, play_next = true,
            o = this.options;
        if ( this.current_item_type === 'video') {
            data = this.data;
            //TODO: remove direct use of video
            data.time = this.video.currentTime;
            this.notify('post_end', data);
        }
        switch ( o.list_mode ) {
            case 'playnstop':
                play_next = false;
            case 'loop':
                this.current_playing += 1;
            case 'repeat':
                if ( o.list_mode === 'repeat' && this.current_item_type === 'image' ) this.current_playing += 1;
                data = this.data.media[this.current_playing];
                if ( ! data ) {
                    this.current_playing = 0;
                    play_next = false;
                    this._removeCurrentItem();
                    break;
                }
                this._removeCurrentItem()
                    ._addItem(data)
                    ._registerNextListener(data);
                if ( play_next && data.itype === 'video' ) this.play();
                break;
        }
        return this;
    },
    initVideo               : function () {
        return this;
    },
    destroyVideo            : function () {
        return this;
    },
    play                    : function () {
        return this;
    },
    maximize                : function (max) {
        return this;
    },
    hideVideo               : function (hide) {
        return this;
    },
    setItem                 : function (url) {
        return this;
    },
    seek                    : function (time) {
        return this;
    }
});