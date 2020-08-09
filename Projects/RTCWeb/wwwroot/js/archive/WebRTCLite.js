//https://jsfiddle.net/jib1/2yLakm60

var localStream;
var remoteStream;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');


const pc = new RTCPeerConnection();

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
    sc.send({ candidate });
}
pc.onnegotiationneeded = async () => {
    await pc.setLocalDescription(await pc.createOffer());
    console.log('on onnegotiationneeded', pc.localDescription);
    sc.send({ sdp: pc.localDescription });
}

const sc = new localSocket(); // localStorage signaling hack
sc.onmessage = async ({ data: { sdp, candidate } }) => {
    if (sdp) {
        console.log('sdp', sdp);
        await pc.setRemoteDescription(sdp);
        if (sdp.type == "offer") {
            await pc.setLocalDescription(await pc.createAnswer());
            console.log('answer', pc.localDescription);
            sc.send({ sdp: pc.localDescription });
        }
    } else if (candidate) {
        //console.log('candidate', candidate);
        await pc.addIceCandidate(candidate);
    }
}