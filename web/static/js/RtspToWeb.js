var rtspPlayer={
  active:false,
  type:'live',
  hls:null,
  ws:null,
  mseSourceBuffer:null,
  mse:null,
  mseQueue:[],
  mseStreamingStarted:false,
  webrtc:null,
  webrtcSendChannel:null,
  webrtcSendChannelInterval:null,
  uuid:null,

  clearPlayer:function(){
    if(this.active){

      if(this.hls!=null){
        this.hls.destroy();
        this.hls=null;
      }
      if(this.ws!=null){
        //close WebSocket connection if opened
        this.ws.close(1000);
        this.ws=null;
      }
      if(this.webrtc!=null){
        clearInterval(this.webrtcSendChannelInterval);

        this.webrtc=null;
      }
      $('#videoPlayer')[0].src = '';
      $('#videoPlayer')[0].load();


      this.active=false;
    }
  },
  livePlayer:function(type,uuid){
    this.clearPlayer();
    this.uuid=uuid;
    this.active=true;

    $('.streams-vs-player').addClass('active-player');
    this.playHls();

  },
  playHls:function(){
    if(this.hls==null && Hls.isSupported()){
        this.hls = new Hls();
    }
    if ($("#videoPlayer")[0].canPlayType('application/vnd.apple.mpegurl')) {
      $("#videoPlayer")[0].src = this.streamPlayUrl();
      $("#videoPlayer")[0].load();
    } else {
      if (this.hls != null) {
        this.hls.loadSource(this.streamPlayUrl());
        this.hls.attachMedia($("#videoPlayer")[0]);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Your browser don`t support hls '
        })
      }
    }
  },
  streamPlayUrl:function(){
    return '/stream/' + this.uuid + '/hls/live/index.m3u8';
  }

}
