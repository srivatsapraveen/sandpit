'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

/////////////////////////////////////////////////CONFIGS/////////////////////////////////
//var pcConfig = {
//    'iceServers': [{
//        'urls': 'stun:stun.l.google.com:19302'
//    }]
//};

var pcConfig = {
      'iceServers': [{ 
        'urls': ['stun:bn-turn1.xirsys.com']
      }, {
        'username': 'IVNphUJyVB96xzqM4rHGMEPn2iQLgXc5WB_BQWw2uaH4lGUFRozFmFqnwow2aYeoAAAAAF8qu2ZuaWdpbg==', 'credential': 'f7bb5574-d723-11ea-9634-0242ac140004',
         'urls': ['turn:bn-turn1.xirsys.com:80?transport=udp', 'turn:bn-turn1.xirsys.com:3478?transport=udp', 'turn:bn-turn1.xirsys.com:80?transport=tcp', 'turn:bn-turn1.xirsys.com:3478?transport=tcp', 'turns:bn-turn1.xirsys.com:443?transport=tcp', 'turns:bn-turn1.xirsys.com:5349?transport=tcp']
      }]
};


// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};

/////////////////////////////////////////////////SIGNALR INIT METHODS/////////////////////////////////

var connection = new signalR.HubConnectionBuilder().withUrl("/rtcHub").build();
connection.start().then(function () {
    console.log('SignalR Connected Successfully');
    InitWebRTC();
}).catch(function (err) {
    return console.error(err.toString());
});

function sendMessage(type, message) {
    console.log('Client sending message: ', message);
    connection.invoke("Send", type, message).catch(function (err) {
        return console.error(err.toString());
    });
}

connection.on("created", function (ucount) {
    console.log('Created...' + ucount);
    isInitiator = true;
});

connection.on("joined", function (ucount) {
    console.log('Joined...' + ucount);
    isChannelReady = true;

});

connection.on("disconnected", function (ucount) {
    console.log('Disconnected...' + ucount);
});

connection.on("Receive", function (type, message) {
    console.log('Recieving...' + type);
    switch (type) {
        case 'gotmedia':
            console.log('gotmedia:' + message);
            maybeStart();
            break;

        case 'offer':
            console.log('offer:' + message);
            if (!isInitiator && !isStarted) {
                console.log('isInitiator is FALSE AND isStarted is FALSE');
                maybeStart();   
            }
            pc.setRemoteDescription(new RTCSessionDescription(message));
            doAnswer();
            break;
        case 'answer':
            console.log('answer:' + message);
            if (isStarted) {
                console.log('isStarted TRUE');
                pc.setRemoteDescription(new RTCSessionDescription(message));
            }
            break;
        case 'candidate':
            console.log('candidate:' + message);
            if (isStarted) {
                console.log('isStarted TRUE');
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });
                pc.addIceCandidate(candidate);                
            }
            break;
        case 'hangup':
            console.log('hangup:' + message);
            if (isStarted) {
                console.log('isStarted TRUE... hanging up now.....');
                handleRemoteHangup();
            }
            break;
        default:
            console.log('UNKNOWN TYPE : ' + type + ', message:' + message);
    }
});


/////////////////////////////////////////////////WEB RTC METHODS/////////////////////////////////
function InitWebRTC() {
    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
    })
        .then(gotStream)
        .catch(function (e) {
            alert('getUserMedia() error: ' + e.name);
        });
}

// Define peer connections, streams and video elements.
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

function gotStream(stream) {
    console.log('Adding local stream.');
    localStream = stream;
    localVideo.srcObject = stream;
    sendMessage('gotmedia','live streaming.....');
    if (isInitiator) {
        maybeStart();
    }
}

var constraints = {
    video: true
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
    requestTurn(
        'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
    );
}

function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
            doCall();
        }
    }
}

window.onbeforeunload = function () {
    sendMessage('hangup','bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = handleIceCandidate;
        pc.onaddstream = handleRemoteStreamAdded;
        pc.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        var candidateJSON = {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        };
        sendMessage('candidate', JSON.stringify(candidateJSON));
    } else {
        console.log('End of candidates.');
    }
}

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}

function doCall() {
    console.log('Sending offer to peer');
    pc.createOffer(setLocalAndSendOffer, handleCreateOfferError);
}

function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer().then(
        setLocalAndSendAnswer,
        onCreateSessionDescriptionError
    );
}

//function setLocalAndSendMessage(sessionDescription) {
//    pc.setLocalDescription(sessionDescription);
//    console.log('setLocalAndSendMessage sending message', sessionDescription);
//    sendMessage(sessionDescription);
//}


function setLocalAndSendOffer(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage('offer',sessionDescription);
}


function setLocalAndSendAnswer(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage('answer',sessionDescription);
}

function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
    turnReady = true;
}
//function requestTurn(turnURL) {
//    var turnExists = false;
//    for (var i in pcConfig.iceServers) {
//        if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
//            turnExists = true;
//            turnReady = true;
//            break;
//        }
//    }
//    if (!turnExists) {
//        alert('THIS SHOULD NEVER RUN IN THE REAL WORLD');
//        console.log('Getting TURN server from ', turnURL);
//        // No TURN server. Get one from computeengineondemand.appspot.com:
//        var xhr = new XMLHttpRequest();
//        xhr.onreadystatechange = function () {
//            if (xhr.readyState === 4 && xhr.status === 200) {
//                var turnServer = JSON.parse(xhr.responseText);
//                console.log('Got TURN server: ', turnServer);
//                pcConfig.iceServers.push({
//                    'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
//                    'credential': turnServer.password
//                });
//                turnReady = true;
//            }
//        };
//        xhr.open('GET', turnURL, true);
//        xhr.send();
//    }
//}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteStream = event.stream;
    remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}

function hangup() {
    console.log('Hanging up.');
    stop();
    sendMessage('hangup','bye');
}

function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}

function stop() {
    isStarted = false;
    pc.close();
    pc = null;
}

