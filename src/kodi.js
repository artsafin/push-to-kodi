(function(){

    function log() {
        console.log.apply(console, Array.prototype.slice.call(arguments));
    }

    function getAuthorization(user, pass) {
        return 'Basic ' + btoa(user + ":" + pass);
    }

    function send(method, params) {
        return Q.Promise(function(resolve, reject){
            if (!method) {
                reject(new Error('method is empty'));
            }

            settings.get().then(function(cfg){
                console.log('calling kodi with cfg', cfg);

                if (!cfg.host) {
                    reject(new Error("kodi cfg: host not set"));
                }

                var xhr = new XMLHttpRequest();
                xhr.open("POST", cfg.host + "/jsonrpc", true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Authorization", getAuthorization(cfg.user || '', cfg.password || ''));
                xhr.onload = function() {
                    if (xhr.status == 200) {
                        var json = JSON.parse(xhr.responseText);
                        if (json && json.error) {
                            reject(new Error("kodi error: " + JSON.stringify(json.error)));
                        } else {
                            resolve(json);
                        }
                    } else {
                        reject(new Error("kodi status not 200: " + xhr.status + " " + xhr.statusText), xhr.status);
                    }
                }
                xhr.onerror = function(){
                    reject(new Error("kodi: xhr failed"));
                }

                var jsonRpcReq;

                if (_.isArray(method)) {
                    jsonRpcReq = _.map(method, function(m){
                        return {"jsonrpc": "2.0", "method": m[0], "params": m[1], "id": 1};
                    });
                } else {
                    jsonRpcReq = {"jsonrpc": "2.0", "method": method, "params": params, "id": 1};
                }

                xhr.send(JSON.stringify(jsonRpcReq));
            });
        });
    }

    function createKodiHandler(port) {
        return function (data) {
            console.log('kodi - onMessage', data);

            if (data.action == 'playList') {
                send("Playlist.GetPlaylists").then(function(json){
                    var playlistDef = _.findWhere(json.result, {"type": "video"});

                    if (playlistDef.playlistid != undefined) {
                        var req = [["Playlist.Clear", {playlistid: playlistDef.playlistid}]]
                            .concat(
                                _.map(data.media, function(m){
                                    return ["Playlist.Add", {playlistid: playlistDef.playlistid, item: {file: m.url}}];
                                })
                            )
                            .concat([['Player.Open', {item: {playlistid: playlistDef.playlistid}}]]);

                        send(req).fail(log);
                    }
                });
            } else if (data.action == 'playOne') {
                if (data.media && data.media.url) {
                    send("Player.Open", {item: {file: data.media.url}}).fail(log);
                }
            } else if (data.action == 'ping') {
                send("JSONRPC.Ping").then(function(data){
                    if (data.result == 'pong') {
                        port.postMessage({action: "pong"});
                    }
                }, log);
            }
        }
    }

    chrome.runtime.onConnect.addListener(function(p) {
        console.log('kodi - onConnect', p);

        if (p.name == "kodi") {
            p.onMessage.addListener(createKodiHandler(p));
        }
    });

    var settings = new Settings(['host', 'user', 'password']);
})();