//https://jsfiddle.net/jib1/2yLakm60

/////////////////////////////////////////////////SIGNALR INIT METHODS/////////////////////////////////
//const sc = new localSocket(); // localStorage signaling hack
//sc.onmessage = async ({ data: { sdp, candidate } }) => {
//    if (sdp) {
//        await pc.setRemoteDescription(sdp);
//        if (sdp.type == "offer") {
//            await pc.setLocalDescription(await pc.createAnswer());
//            sc.send({ sdp: pc.localDescription });
//        }
//    } else if (candidate) await pc.addIceCandidate(candidate);
//}

var connection = new signalR.HubConnectionBuilder().withUrl("/rtclitehub").build();
connection.start().then(function () {
    console.log('SignalR Connected Successfully');
}).catch(function (err) {
    return console.error(err.toString());
});


function send(message) {
    console.log('Sending...' + JSON.stringify(message));
    connection.invoke("Send", JSON.stringify(message)).catch(function (err) {
        return console.error('COULD NOT SEND TO SERVER:' + err.toString());
    });
}

connection.on("Receive", function (message) {
    console.log('Recieving ...' + message);
    var msg = JSON.parse(message);
    if (msg.test) console.log('Testing 1..2..3..');
    if (msg.sdp) {
        console.log('IS SDP');
        pc.setRemoteDescription(sdp);
        if (msg.sdp.type == "offer") {
            console.log('IS SDP:OFFER');
            pc.setLocalDescription(pc.createAnswer());
            send({ sdp: pc.localDescription });
        }
    } else if (msg.candidate) {
        console.log('IS CANDIDATE');
        pc.addIceCandidate(candidate);
    }
});

/////////////////////////////////////////////////SIGNALR INIT METHODS/////////////////////////////////

var localStream;
var remoteStream;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');


const pc = new RTCPeerConnection();

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);

function startAction() {
    send({ test: 'Hello JSON World' });
}
function callAction() {
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
    for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);//triggers an icecandidate and connection change. should call send candidate.
    }
    console.log(localStream);
}
pc.ontrack = ({ streams }) => remoteVideo.srcObject = streams[0];
pc.oniceconnectionstatechange = () => console.log('oniceconnectionstatechange...',pc.iceConnectionState);
pc.onicecandidate = ({ candidate }) => send({ candidate });
pc.onnegotiationneeded = async () => {
    await pc.setLocalDescription(await pc.createOffer());
    send({ sdp: pc.localDescription });
}

