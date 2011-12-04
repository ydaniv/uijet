uijet.Adapter('Video', {
    initVideo   : function () {
        this.Video = new window.Video();
        this.Video.init({
            element     : this.$element,
            video_data  : this.data
        });
        return this;
    },
    destroyVideo: function () {
        this.Video && this.Video.destroy();
        return this;
    },
    setItem     : function (url) {
        this.Video.setSrc(url);
        return this;
    },
    play        : function () {
        this.Video.playPause(true);
        return this;
    },
    seek        : function (time) {
        this.Video.safeSeek(time);
        return this;
    },
    maximize    : function (toggle) {
        var top, that = this, video_h, $video = this.Video.$video;
        if ( typeof toggle == 'boolean' ) {
            this.Video.$container.toggleClass('fullscreen', toggle);
        }
        switch ( this.current_item_type ) {
            case 'video':
            default:
                if ( this.Video.$container.hasClass('fullscreen') ) {
                    video_h = $video.height();
                    top = (($(window).height() - video_h)/2);
                    if ( top < 0 || ! video_h ) {
                        $video.one('playing', function () {
                            that.maximize();
                        });
                        return this;
                    }
                    $video.css({
                        position: 'relative',
                        top     : top + 'px'
                    });
                    this.notify('post_maximize',this.data)
                } else {
                    $video.removeAttr('style');
                    this.notify('post_restore', this.data)
                }
                break;
        }
        return this;
    },
    hideVideo   : function (hide) {
        if ( arguments.length === 0 ) hide = true;
        if ( uijet.is_iPad ) {
            this.Video && this.Video.iOSToggle(!hide);
        } else {
            if ( typeof hide == 'boolean' ) {
                this.Video.$video.toggleClass('hide', hide);
            }
        }
        return this;
    }
});