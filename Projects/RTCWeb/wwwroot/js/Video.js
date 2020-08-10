//Basic RTC with local signalling https://jsfiddle.net/jib1/2yLakm60
//Mute Audio/Video https://jsfiddle.net/j1elo/n3tf0rtL/
//https://github.com/Kurento/experiments/blob/master/WebRTC/mute-tracks/mute-tracks.js (also has debug info for getstats())

//var pcConfig = {
//    'iceServers': [{
//        'urls': 'stun:stun.l.google.com:19302'
//    }]
//};
var logHUBready = false;
var logHUB = new signalR.HubConnectionBuilder().withUrl("/loghub").withAutomaticReconnect().build();
logHUB.serverTimeoutInMilliseconds = 1000 * 60 * 10;
logHUB.start().then(function () {
    console.log('LogHUB Started Successfully');
    logHUBready = true;
}).catch(function (err) {
    return console.error(err.toString());
});


var pcConfig = {
      iceServers: [{
        urls: ["stun:bn-turn1.xirsys.com"]
      }, {
              username: "3IN_OdPatgNkBntmyUCJzY2mrq335zzIFjVsQ4sokQlcts5izrxWyeSSfBggEC9bAAAAAF8quGdwdmF0c2E=",
              credential: "2e60370e-d722-11ea-b5ff-0242ac140004",
              urls: ["turn:bn-turn1.xirsys.com:80?transport=udp", "turn:bn-turn1.xirsys.com:3478?transport=udp", "turn:bn-turn1.xirsys.com:80?transport=tcp", "turn:bn-turn1.xirsys.com:3478?transport=tcp", "turns:bn-turn1.xirsys.com:443?transport=tcp", "turns:bn-turn1.xirsys.com:5349?transport=tcp"]
          }]
};

var video_constraints = {
    mandatory: {
        maxHeight: 240,
        maxWidth: 320
    },
    optional: []
};

var localStream;
var remoteStream;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const pc = new RTCPeerConnection(pcConfig);

var showaudio = false;
var showvideo = false;

function connect() {
    alert('konnecting!!!');
    startAction();
}
//const startButton = document.getElementById('startButton');
//startButton.addEventListener('click', startAction);
function toggle(media) {
    if (media === 'video') showvideo = !showvideo;
    if (media === 'audio') showaudio = !showaudio;
    if (showvideo) { $("#vidicon").removeClass("fas fa-video-slash"); $("#vidicon").addClass("fas fa-video"); }
    else { $("#vidicon").removeClass("fas fa-video"); $("#vidicon").addClass("fas fa-video-slash");}
    if (showaudio) { $("#audicon").removeClass("fas fa-microphone-alt-slash"); $("#audicon").addClass("fas fa-microphone-alt"); }
    else { $("#audicon").removeClass("fas fa-microphone-alt"); $("#audicon").addClass("fas fa-microphone-alt-slash"); }

    doAction();
}
function startAction() {
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video_constraints
    })
        .then(gotStream)
        .catch(function (e) {
            alert('getUserMedia() error: ' + e.name);
        });    
}

function gotStream(stream) {
    debugLog('Adding local stream.');
    localStream = stream;
    localVideo.srcObject = localStream;

    aTrack = localStream.getAudioTracks()[0];
    aSender = pc.addTrack(aTrack, localStream);

    vTrack = localStream.getVideoTracks()[0];
    vSender = pc.addTrack(vTrack, localStream);

    _vBitRate = 120; _aBitRate = 120;
    const parameters = vSender.getParameters();
    debugLog('Initial params..',parameters);

    if (!parameters.encodings) {
        parameters.encodings = [{}];
    }
    if (vSender.track.kind === "video") {
        if (parameters.encodings.length > 0) {
            if (_vBitRate == 0) {
                delete parameters.encodings[0].maxBitrate;
            } else {
                parameters.encodings[0].maxBitrate = _vBitRate * 1000;
            }
        }
    } else {
        if (parameters.encodings.length > 0) {
            if (_aBitRate == 0) {
                delete parameters.encodings[0].maxBitrate;
            } else {
                parameters.encodings[0].maxBitrate = _vBitRate * 1000;
            }
        }
    }

    debugLog('Updated params..',parameters);
    vSender.setParameters(parameters)
    //vTrack.enabled = false;
    //aTrack.enabled = false;

    if (showvideo) { vTrack.enabled = true; } else { vTrack.enabled = false; }
    if (showaudio) { aTrack.enabled = true; } else { aTrack.enabled = false; }
    //debugLog(localStream);
}

function doAction() {

    if (localStream === undefined) startAction();
    else {
        if (showvideo) { vTrack.enabled = true; } else { vTrack.enabled = false; }
        if (showaudio) { aTrack.enabled = true; } else { aTrack.enabled = false; }
    }


    //for (const t of localStream.getTracks()) {
    //    //debugLog('t.kind', t.kind);
    //    if (t.kind === 'video' && showvideo) { vTrack.enabled = true; } else { vTrack.enabled = false; }
    //    if (t.kind === 'audio' && showaudio) { aTrack.enabled = true; } else { aTrack.enabled = false; }
    //    //pc.replaceTrack();
    //}
}

//function endAction() {
//    localStream = null;
//    localVideo.srcObject = null;

//    const senders = pc.getSenders();
//    senders.forEach((sender) => {

//        pc.removeTrack(sender)
//    });
//}
//startAction(false,false);

//pc.onaddstream = handleRemoteStreamAdded;

//function handleRemoteStreamAdded(event) {
//    debugLog('Remote stream added.');
//    remoteStream = event.stream;
//    remoteVideo.srcObject = remoteStream;

//    //Play it
//    debugLog('Remote stream playing.');
//    remoteVideo.autoplay = true;
//    remoteVideo.playsInline = true;
//    remoteVideo.muted = true;

//    debugLog(remoteStream);
//}

pc.ontrack = ({ streams }) => {
    debugLog('on track - setting remote stream', streams);
    remoteVideo.srcObject = streams[0];
    remoteVideo.onloadedmetadata = function (e) {
        remoteVideo.play();
    };
}
pc.oniceconnectionstatechange = () => {
    debugLog('on iceconnectionstatechnge', pc.iceConnectionState);
    if (pc.iceConnectionState === 'disconnected') remoteVideo.srcObject = null;
}
pc.onicecandidate = ({ candidate }) => {
    //debugLog('on icecandidate', candidate);
    send({ candidate });
}
pc.onnegotiationneeded = async () => {
    await pc.setLocalDescription(await pc.createOffer());
    debugLog('on onnegotiationneeded', pc.localDescription);
    send({ sdp: pc.localDescription });
}

//const sc = new localSocket(); // localStorage signaling hack
//sc.onmessage = async ({ data: { sdp, candidate } }) => {
//    if (sdp) {
//        debugLog('sdp', sdp);
//        await pc.setRemoteDescription(sdp);
//        if (sdp.type == "offer") {
//            await pc.setLocalDescription(await pc.createAnswer());
//            debugLog('answer', pc.localDescription);
//            sc.send({ sdp: pc.localDescription });
//        }
//        else {
//          debugLog('got answer', sdp);
//        }
//    } else if (candidate) {
//        debugLog('candidate', candidate);
//        await pc.addIceCandidate(candidate);
//    }
//}

var rtcHUB = new signalR.HubConnectionBuilder().withUrl("/rtclitehub").withAutomaticReconnect().build();
rtcHUB.serverTimeoutInMilliseconds = 1000 * 60 * 10; 
rtcHUB.start().then(function () {
    debugLog('SignalR Connected Successfully');
    startAction();
    //shareScreen();
}).catch(function (err) {
    return console.error(err.toString());
});


function send(message) {
    //debugLog('Sending...' + JSON.stringify(message));
    rtcHUB.invoke("Send", JSON.stringify(message)).catch(function (err) {
        return console.error('COULD NOT SEND TO SERVER:' + err.toString());
    });
}

rtcHUB.on("Receive", function (message) {
    //debugLog('Recieving ...' + message);
    var msg = JSON.parse(message);    
    if (('sdp' in msg)) {
        debugLog('sdp' + msg.sdp.type);
        pc.setRemoteDescription(msg.sdp);
        if ((msg.sdp.type === "offer")) {
            debugLog('got offer sending answer', pc.localDescription);
            pc.setLocalDescription(pc.createAnswer());
            debugLog('answer', pc.localDescription);
            send({ sdp: pc.localDescription });
        }
        //else {
        //    debugLog('got answer', sdp);
        //}
    } else if ('candidate' in msg) {
        debugLog('candidate', candidate);
        pc.addIceCandidate(candidate);
    }
});

function debugLog(message) {
    console.log(message);
    msg = message;
    if (logHUBready)
        logHUB.invoke("Log", user, JSON.stringify(msg)).catch(function (err) {
            return console.error('COULD NOT SEND TO SERVER:' + err.toString());
        });
}