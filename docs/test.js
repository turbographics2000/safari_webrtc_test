window.AudioContext = window.AudioContext || window.webkitAudioContext;
var ctxs = [];
var ua = navigator.userAgent.toLowerCase();
var isSafari = ua.includes('mac os x 10_13') && ua.includes('safari') && !ua.includes('chrome');
var rafId = null;

function canvasSetup(videoFileName) {
  var video = document.createElement('video');
  video.autoplay = true;
  var cnv = document.createElement('canvas');
  var ctx = cnv.getContext('2d');
  ctx.targetVideo = video;
  ctxs.push(ctx);
  return Promise.resolve(video).then(vid => {
    return new Promise((resolve, reject) => {
      vid.onloadedmetadata = evt => {
        var itemContainer = document.createElement('li');
        itemContainer.className = 'item-container';
        cnv.style.left = '-200px';
        cnv.width = vid.videoWidth;
        cnv.height = vid.videoHeight;
        vid.style.width = cnv.style.width = '200px';
        vid.style.height = cnv.style.height = (cnv.height / cnv.width * 200) + 'px';
        itemContainer.appendChild(vid);
        itemContainer.appendChild(cnv);
        selfStreamContainer.appendChild(itemContainer);
        var stream = cnv.captureStream(30);
        if (!rafId) {
          rafId = requestAnimationFrame(drawFrame);
        }
        resolve(stream);
      };
      vid.onended = evt => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      }
      vid.src = videoFileName;
    });
  });
}

function drawFrame() {
  rafId = requestAnimationFrame(drawFrame);
  ctxs.forEach(ctx => {
    ctx.drawImage(ctx.targetVideo, 0, 0, ctx.targetVideo.videoWidth, ctx.targetVideo.videoHeight);
  })
}

function webCamSetup() {
  return navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    cnv.style.display = 'none';
    selfView.srcObject = stream;
    return stream;
  }).catch(ex => console.log('getUserMedia error.', ex));
}


var peer = new Peer({ key: 'ce16d9aa-4119-4097-a8a5-3a5016c6a81c', debug: 3 });

peer.on('open', id => {
  console.log('peer on "open"');
  myIdDisp.textContent = id;
  btnStart.onclick = evt => {
    var ua = navigator.userAgent.toLowerCase();
    if (isSafari) {
      canvasSetup('sintel.mp4').then(stream => {
        var call = peer.call(callTo.value, stream);
        callSetup(call);
      });
    } else {
      canvasSetup('bb_scaled.mp4').then(stream => {
        var call = peer.call(callTo.value, stream);
        callSetup(call);
      });
      // webCamSetup().then(stream => {
      //   var call = peer.call(callTo.value, stream);
      //   callSetup(call);
      // });
    }
  }
});

peer.on('call', call => {
  console.log('peer on "call"');
  canvasSetup(isSafari ? 'sintel.mp4' : 'bb_scaled.mp4').then(stream => {
    call.answer(stream);
  });
  // webCamSetup().then(stream => {
  //   call.answer(stream);
  // });
  callSetup(call);
  // var conn = peer.connect(callTo.value);
  // dcSetup(conn);
});

peer.on('connection', conn => {
  console.log('peer on "connection"');
  dcSetup(conn);
});

function callSetup(call) {
  call.on('stream', stream => {
    console.log('call on "stream"');
    var vid = document.createElement('video');
    vid.onloadedmetadata = evt => {
      vid.style.width = '200px';
      vid.style.height = (vid.videoHeight / vid.videoWidth * 200) + 'px';
      remoteStreamContainer.appendChild(vid);
    }
    vid.srcObject = stream;
    btnAddStream.style.display = btnAddAudioStream.style.display = '';
    btnAddStream.onclick = evt => {
      canvasSetup(isSafari ? 'ed_scaled.mp4' : 'tos_scaled.mp4').then(stream => {
        var call = peer.call(callTo.value, stream);
        btnAddStream.style.display = '';
        callSetup(call);
      });
    }
    btnAddAudioStream.onclick = evt => {
      getAudioFromDevice().then(stream => {
        var call = peer.call(callTo.value, stream);
        btnAddAudioStream.style.display = '';
        callSetup(call);
      });
    }
  });
  call.on('close', _ => {
    console.log('call on "close"');
  });
}

function dcSetup(conn) {
  conn.on('data', function (data) {
    console.log('conn on "data"');
    console.log(data);
  });
  conn.on('open', _ => {
    console.log('conn(dc) on "open"');
    conn.send('hi!');
    btnStart.style.display = 'none';
  });
}



function getAudioStreamFromFile() {
  var ac = new AudioContext();
  var asrc = ac.createBufferSource();
  return fetch('nc158853.mp3').then(res => res.arrayBuffer()).then(audioData => {
    ac.decodeAudioData(audioData, function (buffer) {
      asrc.buffer = buffer;
      var streamDest = ac.createMediaStreamDestination();
      asrc.connect(streamDest);
      streamDest.connect(ac.destination);
      asrc.loop = true;
      asrc.start();
      return streamDest.stream;
    }, function (e) {
      console.log("Error with decoding audio data" + e.err);
    });
  });
}

function getAudioFromDevice() {
  return navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(stream => {
    return stream;
  });
}