//https://jsfiddle.net/jib1/2yLakm60

var tempmsg;

var pcConfig = {
    'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
    }]
};

var localStream;
var remoteStream;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');


const pc = new RTCPeerConnection(pcConfig);

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', startAction);
function startAction() {
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
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
    console.log('Adding tracks to PC');
    for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
    }
    console.log(localStream);
}

pc.ontrack = ({ streams }) => {
    console.log('on track - setting remote stream', streams);
    remoteVideo.srcObject = streams[0];
}
pc.oniceconnectionstatechange = () => {
    console.log('on iceconnectionstatechnge',pc.iceConnectionState);
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

var connection = new signalR.HubConnectionBuilder().withUrl("/rtclitehub").build();
connection.start().then(function () {
    console.log('SignalR Connected Successfully');
}).catch(function (err) {
    return console.error(err.toString());
});


function send(message) {
    //console.log('Sending...' + JSON.stringify(message));
    connection.invoke("Send", JSON.stringify(message)).catch(function (err) {
        return console.error('COULD NOT SEND TO SERVER:' + err.toString());
    });
}

connection.on("Receive", function (message) {
    //console.log('Recieving ...' + message);
    var msg = JSON.parse(message);    
    tempmsg = msg;
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