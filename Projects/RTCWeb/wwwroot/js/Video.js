//Basic RTC with local signalling https://jsfiddle.net/jib1/2yLakm60
//Mute Audio/Video https://jsfiddle.net/j1elo/n3tf0rtL/
//https://github.com/Kurento/experiments/blob/master/WebRTC/mute-tracks/mute-tracks.js (also has debug info for getstats())

var logHUBready = false;
var logHUB = new signalR.HubConnectionBuilder().withUrl("/loghub").withAutomaticReconnect().build();
logHUB.serverTimeoutInMilliseconds = 1000 * 60 * 10;
logHUB.start().then(function () {
    console.log('LogHUB Started Successfully');
    logHUBready = true;
}).catch(function (err) {
    return console.error(err.toString());
});

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

var video_constraints = {
    mandatory: {
        maxHeight: 240,
        maxWidth: 320
    },
    optional: []
};

const pc = new RTCPeerConnection(pcConfig);

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
    //pc.localDescription = setMediaBitrates(pc.localDescription);
    send({ sdp: pc.localDescription });
}
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
var showaudio = false;
var showvideo = true;
var localStream;
var remoteStream;
var vTrack; var aTrack;
var vSender; var aSender;

function toggleUI() {
    if (showvideo) { $("#vidicon").removeClass("fas fa-video-slash"); $("#vidicon").addClass("fas fa-video"); }
    else { $("#vidicon").removeClass("fas fa-video"); $("#vidicon").addClass("fas fa-video-slash"); }
    if (showaudio) { $("#audicon").removeClass("fas fa-microphone-alt-slash"); $("#audicon").addClass("fas fa-microphone-alt"); }
    else { $("#audicon").removeClass("fas fa-microphone-alt"); $("#audicon").addClass("fas fa-microphone-alt-slash"); }
}

toggleUI();

function toggle(media) {
    if (media === 'video') showvideo = !showvideo;
    if (media === 'audio') showaudio = !showaudio;
    toggleUI();
    updateTracks();
}

function getVideo() {
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video_constraints
    })
        .then(showVideo)
        .catch(function (e) {
            alert('getUserMedia() error: ' + e.name);
        });    
}

function showVideo(stream) {
    debugLog('Showing local camera..');
    localStream = stream;
    localVideo.srcObject = localStream;
    localVideo.clientHeight = 105; localVideo.clientWidth = 140;
    addTracks();
}
function reconnect() {
    if ((localStream === undefined)) { debugLog('No localstream to reconnect..'); return; }
    pc.removeTrack(vSender); pc.removeTrack(aSender);
    addTracks();
}
function addTracks() {
    if ((localStream === undefined)) { debugLog('No localstream to addTracks..');return; }

    vTrack = localStream.getVideoTracks()[0];
    vSender = pc.addTrack(vTrack, localStream);

    aTrack = localStream.getAudioTracks()[0];
    aSender = pc.addTrack(aTrack, localStream);
    updateTracks();
    //setBitRate(120, 120);
}

function updateTracks() {
    if (localStream !== undefined) {
        if (showvideo) { vTrack.enabled = true; } else { vTrack.enabled = false; }
        if (showaudio) { aTrack.enabled = true; } else { aTrack.enabled = false; }
    }
}

function setBitRate(_vBitRate, _aBitRate) {
    //const vparams = vSender.getParameters();
    //debugLog('Initial vparams..', vparams);

    const sender = pc.getSenders()[0];
    debugLog('Sender is..', sender);
    const vparams = sender.getParameters();
    debugLog('Initial vparams..', vparams);

    if (!vparams.encodings) { vparams.encodings = [{}]; }
    if (vparams.encodings.length > 0) {
        if (_vBitRate == 0) {
            delete vparams.encodings[0].maxBitrate;
        } else {
            vparams.encodings[0].maxBitrate = _vBitRate * 1000;
        }
    }
    debugLog('Final vparams..', vparams);
    vSender.setParameters(parameters)
        .then(() => {
            
        })
        .catch(e => console.error(e));

    //const aparams = aSender.getParameters();
    //debugLog('Initial aparams..', aparams);

    //if (!aparams.encodings) { aparams.encodings = [{}]; }
    //if (aparams.encodings.length > 0) {
    //    if (_aBitRate == 0) {
    //        delete aparams.encodings[0].maxBitrate;
    //    } else {
    //        aparams.encodings[0].maxBitrate = _aBitRate * 1000;
    //    }
    //}
    //debugLog('Final aparams..', aparams);
    //aSender.setParameters(aparams)
}

var rtcHUB = new signalR.HubConnectionBuilder().withUrl("/rtclitehub").withAutomaticReconnect().build();
rtcHUB.serverTimeoutInMilliseconds = 1000 * 60 * 10; 
rtcHUB.start().then(function () {
    debugLog('SignalR Connected Successfully');
    getVideo();
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
            pc.localDescription = setMediaBitrates(pc.localDescription);
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

function setMediaBitrates(sdp) {
    return sdp;
    //return setMediaBitrate(setMediaBitrate(sdp, "video", 100), "audio", 50);
}

function setMediaBitrate(sdp, mediaType, bitrate) {
    let sdpLines = sdp.toString().split('\n'),
        mediaLineIndex = -1,
        mediaLine = 'm =' + mediaType,
        bitrateLineIndex = -1,
        bitrateLine = 'b = AS: ' + bitrate;

    mediaLineIndex = sdpLines.findIndex(line => line.startsWith(mediaLine));

    // If we find a line matching “m={mediaType}”
    if (mediaLineIndex && mediaLineIndex < sdpLines.length) {
        // Skip the media line
        bitrateLineIndex = mediaLineIndex + 1;

        // Skip both i=* and c=* lines (bandwidths limiters have to come afterwards)
        while (sdpLines[bitrateLineIndex].startsWith('i=') || sdpLines[bitrateLineIndex].startsWith('c=')) {
            bitrateLineIndex++;
        }

        if (sdpLines[bitrateLineIndex].startsWith('b=')) {
            // If the next line is a b=* line, replace it with our new bandwidth
            sdpLines[bitrateLineIndex] = bitrateLine;
        } else {
            // Otherwise insert a new bitrate line.
            sdpLines.splice(bitrateLineIndex, 0, bitrateLine);
        }
    }

    // Then return the updated sdp content as a string
    return sdpLines.join('\n');
}

function setMediaBitrate_old(sdp, media, bitrate) {
    var lines = sdp.toString().split("\n");
    var line = -1;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf("m=" + media) === 0) {
            line = i;
            break;
        }
    }
    if (line === -1) {
        console.debug("Could not find the m line for", media);
        return sdp;
    }
    console.debug("Found the m line for", media, "at line", line);

    // Pass the m line
    line++;

    // Skip i and c lines
    while (lines[line].indexOf("i=") === 0 || lines[line].indexOf("c=") === 0) {
        line++;
    }

    // If we're on a b line, replace it
    if (lines[line].indexOf("b") === 0) {
        console.debug("Replaced b line at line", line);
        lines[line] = "b=AS:" + bitrate;
        return lines.join("\n");
    }

    // Add a new b line
    console.debug("Adding new b line before line", line);
    var newLines = lines.slice(0, line)
    newLines.push("b=AS:" + bitrate)
    newLines = newLines.concat(lines.slice(line, lines.length))
    return newLines.join("\n")
}

function debugLog(message) {
    console.log(message);
    msg = message;
    if (logHUBready)
        logHUB.invoke("Log", user, JSON.stringify(msg)).catch(function (err) {
            return console.error('COULD NOT SEND TO SERVER:' + err.toString());
        });
}