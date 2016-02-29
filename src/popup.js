var KodiPinger = (function(){

  function cls(port, timeout, customFailLimit) {
    this.port = port;
    this.timeout = timeout;
    this.failLimit = (customFailLimit === undefined) ? 3 : customFailLimit;

    this.stop();
  }

  cls.prototype = {
    notAvailable: function(){
      return this.lastState !== null && this.lastState;
    },
    start: function(available, notAvailable){
      var me = this;

      available = available || function(){};
      notAvailable = notAvailable || function(){};

      me.port.onMessage.addListener(function(data){
        console.log('KodiPinger::onMessage', data);
        if (data.action == 'pong') {
          me.noResponseNum = 0;
          me.successNum++;
        }
      });

      me.timerHandle = setInterval(function(){
        me.noResponseNum++;
        me.port.postMessage({action: "ping"});

        var state = me.noResponseNum < me.failLimit && me.successNum > 0;

        if (state !== me.lastState) {
          me.lastState = state;
          state ? available(state) : notAvailable(new Error('Kodi is not available for ' + (me.timeout * me.noResponseNum / 1000) + ' sec'), me.noResponseNum);
        }
      }, me.timeout);
    },
    stop: function(){
      this.timerHandle && clearInterval(this.timerHandle);

      this.lastState = null;
      this.timerHandle = null;
      this.noResponseNum = 0;
      this.successNum = 0;
    }
  };

  return cls;
})();

$(function() {
    var EL = {
      mediaList: $('#mediaList'),
      mediaListItem: $('#mediaList-item'),
      spinner: $('#spinner'),
      title: $('#handlerTitle')
    };

    function setUiState(state) {
      if (state === "loaded") {
        EL.spinner.hide();
      } else { // not_loaded
        EL.spinner.show();
        EL.mediaList.empty();
        EL.title.text('');
      }
    }

    function findItemEl(el) {
      return $(el).closest('.mediaList-item');
    }

    var handlersPort = chrome.runtime.connect({name: "media_fetch"}),
        kodiPort = chrome.runtime.connect({name: "kodi"}),
        kodiPinger = new KodiPinger(kodiPort, 2000, 3);

    EL.mediaList.on('click', 'a[href$=playone]:not(.disabled)', function(){
      var mediaData = findItemEl(this).data('mediaData');

      kodiPort.postMessage({action: "playOne", media: mediaData});
    });
    EL.mediaList.on('click', 'a[href$=playfurther]:not(.disabled)', function(){
      var itemEl = findItemEl(this);

      var medias = itemEl.nextAll('.mediaList-item').map(function(){
        return $(this).data('mediaData');
      });

      kodiPort.postMessage({action: "playList", media: [itemEl.data('mediaData')].concat(medias.toArray())});
    });

    handlersPort.onMessage.addListener(function(data){
      console.log('popup - handlersPort::onMessage', data);
      
      if (data.action == 'media') {
          setUiState("loaded");

          EL.title.text(data.source.title);

          renderMediaList(EL.mediaList, data.media);
      }
    });

    function renderMediaList(containerEl, media) {
      var tplContentSelector = EL.mediaListItem.data('tplContentSel'),
          tplLoopIndex = EL.mediaListItem.data('tplLoopIndex'),
          tplContent = EL.mediaListItem.html();

      for (var k in media) {
          var elContent = tplContent;
          if (tplLoopIndex) {
            elContent = tplContent.replace(new RegExp("{{" + tplLoopIndex + "}}", "g"), k);
          }

          var el = $(elContent);

          el.find(tplContentSelector).text(media[k].title);
          el.attr('id', null);
          el.data('mediaData', media[k]);

          if (kodiPinger.notAvailable()) {
            el.find('a[href]').addClass('disabled');
          }

          $(containerEl).append(el);
      }
    }

    function requestRefreshMedia(tabId) {
      setUiState('not_loaded');
      handlersPort.postMessage({
        tabId: tabId,
        action: "refreshMedia"
      });
    }

    // Detect current tab and launch refreshMedia
    chrome.tabs.query({currentWindow: true, active: true, highlighted: true}, function(tabs){
      tabs.forEach(function(tab){
        requestRefreshMedia(tab.id);
      });

      kodiPinger.start(function(state){
        console.log(new Date, 'detected kodi available!', state);
        EL.mediaList.find('.mediaList-item a[href]').removeClass('disabled');
      }, function(err){
        console.log(new Date, 'detected kodi NOT available!', err);
        EL.mediaList.find('.mediaList-item a[href]').addClass('disabled');
      });
    });
});