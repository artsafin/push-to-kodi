var Settings = (function(){
    function cls(cfg){
        this.cfg = cfg;
        this.deferredObj = null;

        var me = this,
            reloadSettings = function (){
                console.log('Settings::reloadSettings');
                me.deferredObj = Q.defer();

                chrome.storage.local.get(cfg, function(items) {
                    console.log('Settings::reloadSettings - reloaded', items);
                    me.deferredObj.resolve(items);
                });
            };

        chrome.storage.onChanged.addListener(reloadSettings);
        reloadSettings();
    }

    cls.prototype = {
        get: function(){
            return this.deferredObj.promise;
        }
    };

    return cls;
})();
