(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(['uijet_dir/uijet', 'rsvp'], function (uijet) {
            return factory(uijet, root.RSVP, root);
        });
    } else {
        factory(uijet, root.RSVP, root);
    }
}(this, function (uijet, RSVP, root) {

    var p_proto = RSVP.Promise.prototype;

    if ( ! ('state' in p_proto) && ! ('promise' in p_proto) ) {
        p_proto.state = function () {
            var state = 'pending';
            if ( this.isResolved ) {
                state = 'resolved';
            }
            else if ( this.isRejected ) {
                state = 'rejected';
            }
            return state;
        };
        p_proto.promise = function () {
            return this;
        };
    }
    else {
        throw new Error('Integration Error: RSVP.Promise.prototype already has that property.');
    }

    uijet.use({
        Promise     : function () {
            return new RSVP.Promise();
        },
        when        : function (promise) {
            return this.isPromise(promise) ? promise : this.Promise().resolve(promise);
        },
        whenAll     : function (promises) {
            return root.all(promises);
        },
        isPromise   : function (obj) {
            return obj && uijet.Utils.isFunc(obj.then);
        }
    });

    return RSVP;
}));