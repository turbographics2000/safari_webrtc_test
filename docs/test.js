var peer = new Peer({ key: 'ce16d9aa-4119-4097-a8a5-3a5016c6a81c', debug: 3 });

peer.on('open', id => {
  console.log('peer on "open"');
  myIdDisp.textContent = id;
  btnStart.onclick = evt => {
    webCamSetup(selfStreamContainer).then(stream => {
      var call = peer.call(callTo.value, stream);
      callSetup(call);
    });
  }
});

peer.on('call', call => {
  console.log('peer on "call"');
  webCamSetup(selfStreamContainer).then(stream => {
    call.answer(stream);
  });
  callSetup(call);
});

peer.on('connection', conn => {
  console.log('peer on "connection"');
  dcSetup(conn);
});

function callSetup(call) {
  call.on('stream', stream => {
    console.log('call on "stream"');
    createVideoElm(remoteStreamContainer, stream);
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

function createVideoElm(container, stream) {
  var vid = document.createElement('video');
  vid.onloadedmetadata = function(evt) {
    console.log('onloadedmetadata');
    this.style.width = (this.videoWidth / this.videoHeight * 160) + 'px';
    this.style.height = '160px';
    container.appendChild(vid);
    this.play();
  }
  vid.srcObject = stream;
  return vid;
}

function webCamSetup(container, video = true, audio = true) {
  return navigator.mediaDevices.getUserMedia({ video, audio }).then(stream => {
    createVideoElm(container, stream);
    return stream;
  }).catch(ex => console.log('getUserMedia error.', ex));
}
