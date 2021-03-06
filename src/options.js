(function(){

    var toastTimeout = 2000,
        inputSelector = ':not(button):input[id]';

    $('form:first').submit(function(e){
        e.preventDefault();

        var map = {};
        $(this).find(inputSelector).each(function(){
            var el = $(this);
            map[this.id] = el.is(':checkbox') ? el.prop('checked') : el.val();
        });

        console.log('save', map);

        chrome.storage.local.set(map, function(){
            Materialize.toast('Settings saved', toastTimeout);
        });
    });

    $('#btn-reset').click(function(){
        chrome.storage.local.clear(function(){
            loadSettings();
            Materialize.toast('Extension has been reset', toastTimeout);
        });
    });

    function loadSettings() {
        chrome.storage.local.get(null, function(items) {
            console.log('load items', items);
            $(inputSelector).each(function(){
                var v = items[this.id],
                    el = $(this);

                if (v === undefined) {
                    v = el.attr('value');
                }
                if (el.is(':checkbox')) {
                    el.prop('checked', !!v);
                } else {
                    el.val(v);
                }
            });
        });
    }

    $(loadSettings);
})();