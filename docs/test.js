var peer = new Peer({ key: 'ce16d9aa-4119-4097-a8a5-3a5016c6a81c', debug: 3 });

peer.on('open', id => {
  console.log('peer on "open"');
  myIdDisp.textContent = id;
  btnStart.onclick = evt => {
    webCamSetup(selfStreamContainer).then(stream => {
      var call = peer.call(callTo.value, stream);
    });
  }
});

peer.on('call', call => {
  console.log('peer on "call"');
  webCamSetup(remoteStreamContainer).then(stream => {
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
  var vid = document.createElement('vid');
  vid.onloadeddata = evt => {
    vid.style.width = (vid.videoWidth / vid.videoHeight * 160) + 'px';
    vid.style.height = '160px';
    conte.appendChild(vid);
    call.answer(stream);
  }
  vid.srcObject = stream;
  return vid;
}

function webCamSetup(container, video, audio) {
  return navigator.mediaDevices.getUserMedia({ video: video, audio: audio }).then(stream => {
    createVideoElm(container, stream);
    return stream;
  }).catch(ex => console.log('getUserMedia error.', ex));
}
