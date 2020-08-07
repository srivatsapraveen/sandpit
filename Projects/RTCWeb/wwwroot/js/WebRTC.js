// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
    audio: false,
    video: true
};

function handleSuccess(stream) {
    const video = document.querySelector('#vid01');
    const videoTracks = stream.getVideoTracks();
    console.log('Got stream with constraints:', constraints);
    console.log('Using video device: ${videoTracks[0].label}');
    //window.stream = stream; // make variable available to browser console
    video.srcObject = stream;
    //video.width = "100%"; video.height = 400;    
}

function handleError(error) {
    if (error.name === 'ConstraintNotSatisfiedError') {
        const v = constraints.video;
        errorMsg('The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.');
    } else if (error.name === 'PermissionDeniedError') {
        errorMsg('Permissions have not been granted to use your camera and ' +
            'microphone, you need to allow the page access to your devices in ' +
            'order for the demo to work.');
    }
    errorMsg('getUserMedia error: ${error.name}', error);
}

function errorMsg(msg, error) {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += "<p>${msg}</p>";
    if (typeof error !== 'undefined') {
        console.error(error);
    }
}

async function init(e) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
        //e.target.disabled = true;
    } catch (e) {
        handleError(e);
    }
}

async function initPeer(e) {
    try {
        var peerConnectionConfig = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };
        //    "iceServers": [
        //        { "urls": "stun:stun.l.google.com:19302?transport=udp" },
        //        { "urls": "stun:numb.viagenie.ca:3478?transport=udp" },
        //        { "urls": "turn:numb.viagenie.ca:3478?transport=udp", "username": "shahzad@fms-tech.com", "credential": "P@ssw0rdfms" },
        //        { "urls": "turn:turn-testdrive.cloudapp.net:3478?transport=udp", "username": "redmond", "credential": "redmond123" }
        //    ]
        //};

        var RTCconnection = new RTCPeerConnection(peerConnectionConfig);
        //const stream = await navigator.mediaDevices.getUserMedia(constraints);
        RTCconnection.addStream(stream);

        RTCconnection.createOffer().then(offer => {
            console.log('WebRTC: created Offer: ');
            console.log('WebRTC: Description after offer: ', offer);
            RTCconnection.setLocalDescription(offer).then(() => {
                console.log('WebRTC: set Local Description: ');
                console.log('connection before sending offer ', RTCconnection);
                setTimeout(() => {
                    sendHubSignal(JSON.stringify({ "sdp": RTCconnection.localDescription }));
                }, 1000);
            }).catch(err => console.error('WebRTC: Error while setting local description', err));
        }).catch(err => console.error('WebRTC: Error while creating offer', err));
    } catch (e) {
        handleError(e);
    }
}
