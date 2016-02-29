(function(){

var capturedPlaylists = {};

function capturePlaylistRequestDetails(details) {
    if (details && details.tabId && details.method && details.url) {
        capturedPlaylists[details.tabId] = {
            method: details.method,
            url: details.url
        };

        console.log('captured', capturedPlaylists);
    }
}

function refreshMedia(tabId) {
    return Q.Promise(function(resolve, reject, notify) {

        if (!capturedPlaylists[tabId]) {
            var err = new Error('No captured playlists for tab ' + tabId);
            console.log('refreshMedia/reject', err);

            reject(err);
        }

        var request = new XMLHttpRequest();

        request.open(capturedPlaylists[tabId].method, capturedPlaylists[tabId].url, true);
        request.onload = onload;
        request.onerror = onerror;
        request.send();

        function onload() {
            if (request.status >= 400) {
                var err = new Error("Status code " + request.status);
                console.log('refreshMedia/reject', err);
                reject(err);
            } else {
                var pls = parsePlaylist(request.responseText);
                console.log('refreshMedia/resolve', pls);
                resolve(pls);
            }
        }

        function onerror() {
            var err = new Error("Can't XHR " + JSON.stringify(capturedPlaylists[tabId]));
            console.log('refreshMedia/reject', err);
            reject(err);
        }
    });
}

function parsePlaylist(text) {
    var json = JSON.parse(text);

    if (!json || !json.playlist || !json.playlist.length) {
        return null;
    }

    return _.map(json.playlist, function(item){
        return {
            type: 'video',
            title: item.comment.replace("<br>", " "),
            url: item.file
        };
    });
}

var handler = new Handler('sv3', 'Seasonvar');
handler.refreshMedia = refreshMedia;

chrome.webRequest.onCompleted.addListener(function(details){
        console.log('webRequest.onCompleted seasonvar.ru/playls2', details);

        if (details.statusCode >= 400) {
            console.log('skipping failed request');
            return;
        }

        if (details.tabId > 0) {
            handler.showPageAction(details.tabId);
            capturePlaylistRequestDetails(details);
        }

    }, {urls: ["*://seasonvar.ru/playls2/*"]});

})();
