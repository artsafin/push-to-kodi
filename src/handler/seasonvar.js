(function(){
    var handlerTitle = "Seasonvar";

    function SvHandler(tabId, title){
        this.tabId = tabId;
        this.title = title;

        this.uiSetLoading();
    };
    SvHandler.prototype = {
        uiSetLoading: function(){
            localStorage.setItem('handlerTitle', this.title);

            chrome.pageAction.hide(this.tabId);
            chrome.pageAction.show(this.tabId);
        },
        findMedia: function(){
            //*
            chrome.tabs.executeScript({
                file: "src/handler/seasonvar_inject.js"
            });
            //*/

            var deferred = Q.defer();

            setTimeout(function(){
                console.log('before deferred.resolve');
                deferred.resolve([
                    {title: "Game of Thrones S01", streamUrl: "http://example.com"},
                    {title: "Game of Thrones S02", streamUrl: "http://example.com"},
                    {title: "Интерны 5 сезон", streamUrl: "http://example.com"}
                ]);
            }, 5000);

            return deferred.promise;
        }
    };

/*
    chrome.webNavigation.onDOMContentLoaded.addListener(function(details){
        if (details.frameId != 0) {
            return;
        }
        console.log('onDOMContentLoaded', details);

        var h = new SvHandler(details.tabId, "Seasonvar");

        chrome.runtime.onConnect.addListener(function(port) {
            console.assert(port.name == "media_fetch");

            port.onMessage.addListener(function(data) {
                console.log('handler - onMessage', data);

                if (data.action == 'refreshMedia') {
                    h.findMedia().then(function(foundMedia){
                        console.log('handler - h.findMedia().then', {action: data.responseAction, media: foundMedia});
                        port.postMessage({action: data.responseAction, media: foundMedia});
                    });
                }
            });
        });

        chrome.runtime.onMessage.addListener(
          function(request, sender, sendResponse) {
            console.log(sender.tab ?
                        "handler - onMessage - from a content script:" + sender.tab.url :
                        "handler - onMessage - from the extension");
            
              sendResponse({farewell: "goodbye"});
          });
    }, {url: [{hostEquals: "seasonvar.ru"}]});

*/

chrome.webNavigation.onDOMContentLoaded.addListener(function(details){
        if (details.frameId != 0) {
            return;
        }

        chrome.tabs.executeScript({
                file: "src/handler/seasonvar_inject.js"
            });
    }, {url: [{hostEquals: "seasonvar.ru"}]});

})();