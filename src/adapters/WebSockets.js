(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet'], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(uijet);
    }
}(function (uijet) {
    uijet.Adapter('WebSockets', {
        open            : function (restart) {
            var push_config = this.options.push_config;
            if ( restart ) {
                this.socket && this.socket.close();
                delete this.socket;
                delete this.socket_promise;
            }
            if ( ! this.socket_promise || this.socket_promise.state() === 'rejected' ) {
                this.socket_promise = uijet.Promise();
            }
            if ( ! this.socket ) {
                this.socket = new WebSocket(this.getPushUrl(), push_config && uijet.utils.returnOf(push_config.protocols, this));
                this.socket.onopen = this._openHandler.bind(this);
                this.socket.onclose = this._closeHandler.bind(this);
                this.socket.onmessage = this._messageHandler.bind(this);
                this.socket.onerror = this._errorHandler.bind(this);
            }
            return this.socket_promise.promise();
        },
        close           : function () {
            this.socket && this.socket.close();
            delete this.socket;
            return this;
        },
        send            : function (msg) {
            if ( this.socket && this.socket.readyState === 1 ) {
                if ( typeof msg != 'string' ) {
                    msg = JSON.stringify(msg);
                }
                this.socket.send(msg);
            } else {
                this.open().then(this.send.bind(this, msg));
            }
            return this;
        },
        _openHandler    : function (e) {
            this.socket_promise.resolve(e);
            this.notify('socket_open', e);
        },
        _closeHandler   : function (e) {
            this.notify('socket_close', e);
        },
        _messageHandler : function (e) {
            this.notify('socket_message', e);
        },
        _errorHandler   : function (e) {
            this.notify('socket_error', e);
        }
    });
}));
