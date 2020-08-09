//https://jsfiddle.net/jib1/2yLakm60

//var pcConfig = {
//    'iceServers': [{
//        'urls': 'stun:stun.l.google.com:19302'
//    }]
//};

var pcConfig = {
      iceServers: [{
        urls: ["stun:bn-turn1.xirsys.com"]
      }, {
              username: "3IN_OdPatgNkBntmyUCJzY2mrq335zzIFjVsQ4sokQlcts5izrxWyeSSfBggEC9bAAAAAF8quGdwdmF0c2E=",
              credential: "2e60370e-d722-11ea-b5ff-0242ac140004",
              urls: ["turn:bn-turn1.xirsys.com:80?transport=udp", "turn:bn-turn1.xirsys.com:3478?transport=udp", "turn:bn-turn1.xirsys.com:80?transport=tcp", "turn:bn-turn1.xirsys.com:3478?transport=tcp", "turns:bn-turn1.xirsys.com:443?transport=tcp", "turns:bn-turn1.xirsys.com:5349?transport=tcp"]
          }]
};

var localStream;
var remoteStream;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const pc = new RTCPeerConnection(pcConfig);

var showaudio = false;
var showvideo = false;

//const startButton = document.getElementById('startButton');
//startButton.addEventListener('click', startAction);
function toggle(media) {
    if (media === 'video') showvideo = !showvideo;
    if (media === 'audio') showaudio = !showaudio;
    if (showvideo) { $("#vidicon").removeClass("fas fa-video-slash"); $("#vidicon").addClass("fas fa-video"); }
    else { $("#vidicon").removeClass("fas fa-video"); $("#vidicon").addClass("fas fa-video-slash");}
    if (showaudio) { $("#audicon").removeClass("fas fa-microphone-alt-slash"); $("#audicon").addClass("fas fa-microphone-alt"); }
    else { $("#audicon").removeClass("fas fa-microphone-alt"); $("#audicon").addClass("fas fa-microphone-alt-slash"); }

    if (showvideo || showaudio)
        startAction();
    else
        endAction();
}
function startAction() {
    navigator.mediaDevices.getUserMedia({
        audio: showaudio,
        video: showvideo
    })
        .then(gotStream)
        .catch(function (e) {
            alert('getUserMedia() error: ' + e.name);
        });    
}

function gotStream(stream) {
    console.log('Adding local stream.');
    localStream = stream;
    localVideo.srcObject = stream;
    //console.log('Adding stream to PC');
    //NOTE : Add stream and onadd stream are deprecated!!!
    //pc.addStream(localStream);

    for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
    }

    console.log(localStream);
}

function endAction() {
    localStream = null;
    localVideo.srcObject = null;

    const senders = pc.getSenders();
    senders.forEach((sender) => pc.removeTrack(sender));
}
//startAction(false,false);

//pc.onaddstream = handleRemoteStreamAdded;

//function handleRemoteStreamAdded(event) {
//    console.log('Remote stream added.');
//    remoteStream = event.stream;
//    remoteVideo.srcObject = remoteStream;

//    //Play it
//    console.log('Remote stream playing.');
//    remoteVideo.autoplay = true;
//    remoteVideo.playsInline = true;
//    remoteVideo.muted = true;

//    console.log(remoteStream);
//}

pc.ontrack = ({ streams }) => {
    console.log('on track - setting remote stream', streams);
    remoteVideo.srcObject = streams[0];
    remoteVideo.onloadedmetadata = function (e) {
        remoteVideo.play();
    };
}
pc.oniceconnectionstatechange = () => {
    console.log('on iceconnectionstatechnge', pc.iceConnectionState);
    if (pc.iceConnectionState === 'disconnected') remoteVideo.srcObject = null;
}
pc.onicecandidate = ({ candidate }) => {
    //console.log('on icecandidate', candidate);
    send({ candidate });
}
pc.onnegotiationneeded = async () => {
    await pc.setLocalDescription(await pc.createOffer());
    console.log('on onnegotiationneeded', pc.localDescription);
    send({ sdp: pc.localDescription });
}

//const sc = new localSocket(); // localStorage signaling hack
//sc.onmessage = async ({ data: { sdp, candidate } }) => {
//    if (sdp) {
//        console.log('sdp', sdp);
//        await pc.setRemoteDescription(sdp);
//        if (sdp.type == "offer") {
//            await pc.setLocalDescription(await pc.createAnswer());
//            console.log('answer', pc.localDescription);
//            sc.send({ sdp: pc.localDescription });
//        }
//        else {
//          console.log('got answer', sdp);
//        }
//    } else if (candidate) {
//        console.log('candidate', candidate);
//        await pc.addIceCandidate(candidate);
//    }
//}

var rtcHUB = new signalR.HubConnectionBuilder().withUrl("/rtclitehub").withAutomaticReconnect().build();
rtcHUB.serverTimeoutInMilliseconds = 1000 * 60 * 10; 
rtcHUB.start().then(function () {
    console.log('SignalR Connected Successfully');
    //shareScreen();
}).catch(function (err) {
    return console.error(err.toString());
});


function send(message) {
    //console.log('Sending...' + JSON.stringify(message));
    rtcHUB.invoke("Send", JSON.stringify(message)).catch(function (err) {
        return console.error('COULD NOT SEND TO SERVER:' + err.toString());
    });
}

rtcHUB.on("Receive", function (message) {
    //console.log('Recieving ...' + message);
    var msg = JSON.parse(message);    
    if (('sdp' in msg)) {
        console.log('sdp' + msg.sdp.type);
        pc.setRemoteDescription(msg.sdp);
        if ((msg.sdp.type === "offer")) {
            console.log('got offer sending answer', pc.localDescription);
            pc.setLocalDescription(pc.createAnswer());
            console.log('answer', pc.localDescription);
            send({ sdp: pc.localDescription });
        }
        //else {
        //    console.log('got answer', sdp);
        //}
    } else if ('candidate' in msg) {
        console.log('candidate', candidate);
        pc.addIceCandidate(candidate);
    }
});