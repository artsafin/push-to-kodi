var Handler = (function(){

    function log(me) {
        console.log.apply(console, ['handler-' + me.alias].concat(Array.prototype.slice.call(arguments).slice(1)));
    }

    function showPageAction(tabId) {
        chrome.pageAction.hide(tabId);
        chrome.pageAction.show(tabId);
    }

    function createMediaFetchHandler(me, port) {
        return function (data) {
            log(me, 'onMessage');

            if (data.action == 'refreshMedia') {
                me.refreshMedia(data.tabId).then(function(media){
                    log(me, 'postMessage', {action: "mediaRefreshed"});
                    port.postMessage({action: "media", source: me, media: media});
                });
            }
        }
    }

    function bindToPort(me) {
        chrome.runtime.onConnect.addListener(function(port) {
            log(me, 'onConnect', port);

            if (port.name == "media_fetch") {
                port.onMessage.addListener(createMediaFetchHandler(me, port));
            }
        });
    }

    function cls(alias, title) {
        this.alias = alias;
        this.title = title;

        log(this, 'start');

        bindToPort(this);
    }
    cls.prototype = {
        showPageAction: showPageAction,
        refreshMedia: function(tabId){
            console.error('empty refreshMedia');

            return Q.Promise(function(_, reject){
                reject(new Error('Handler::refreshMedia must be overrided'));
            });
        }
    };

    return cls;
})();
