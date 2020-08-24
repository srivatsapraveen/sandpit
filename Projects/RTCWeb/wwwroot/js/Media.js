///Basic RTC with local signalling https://jsfiddle.net/jib1/2yLakm60
//Mute Audio/Video https://jsfiddle.net/j1elo/n3tf0rtL/
//https://github.com/Kurento/experiments/blob/master/WebRTC/mute-tracks/mute-tracks.js (also has debug info for getstats())
// Dynamic resize - https://blog.mozilla.org/webrtc/fiddle-week-downscale-video-peerconnection/ - JSFiddle here https://jsfiddle.net/jib1/eL2byuw8/
//https://webrtc.github.io/samples/src/content/peerconnection/constraints/

//ondevicechanged

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


const localVideo = document.getElementById('localVideo');
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

function onbitratechange() {
    alert($("#bitrate").te);
}

function onframeratechange() {
    alert($("#framerate").value);
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
    aTrack = localStream.getAudioTracks()[0];

    vSender = pc.addTrack(vTrack, localStream);
    aSender = pc.addTrack(aTrack, localStream);
    updateTracks();
    setBitRate(120, 120);
    setFrameRate(15, 10);
}

function updateTracks() {
    if (localStream !== undefined) {
        if (showvideo) { vTrack.enabled = true; } else { vTrack.enabled = false; }
        if (showaudio) { aTrack.enabled = true; } else { aTrack.enabled = false; }
    }
}

function setFrameRate(_vFrameRate, _aFrameRate) {
    pc.getSenders().forEach(function (sender) {
        if (sender.track !== null) {
            console.log("Sender TRACK:" + sender.track.kind);
            const parameters = sender.getParameters();
            if (!parameters.encodings) {
                parameters.encodings = [{}];
            }
            if (sender.track.kind !== undefined && sender.track.kind !== null && sender.track.kind === "video") {
                if (parameters.encodings.length > 0) {
                    if (_vBitRate === 0) {
                        delete parameters.encodings[0].maxFramerate;
                    } else {
                        parameters.encodings[0].maxFramerate = _vFrameRate * 1000;
                    }
                }
            } else if (sender.track.kind !== undefined && sender.track.kind !== null && sender.track.kind === "audio") {
                if (parameters.encodings.length > 0) {
                    if (_aBitRate === 0) {
                        delete parameters.encodings[0].maxFramerate;
                    } else {
                        parameters.encodings[0].maxFramerate = _aFrameRate * 1000;
                    }
                }
            }

            sender.setParameters(parameters)
                .then(() => {

                })
                .catch(e => console.error(e));
        }
    });
}

function setBitRate(_vBitRate, _aBitRate) {
    pc.getSenders().forEach(function (sender) {
        if (sender.track !== null) {
            console.log("Sender TRACK:" + sender.track.kind);
            const parameters = sender.getParameters();
            if (!parameters.encodings) {
                parameters.encodings = [{}];
            }
            if (sender.track.kind !== undefined && sender.track.kind !== null && sender.track.kind === "video") {
                if (parameters.encodings.length > 0) {
                    if (_vBitRate === 0) {
                        delete parameters.encodings[0].maxBitrate;
                    } else {
                        parameters.encodings[0].maxBitrate = _vBitRate * 1000;
                    }
                }
            } else if (sender.track.kind !== undefined && sender.track.kind !== null && sender.track.kind === "audio") {
                if (parameters.encodings.length > 0) {
                    if (_aBitRate === 0) {
                        delete parameters.encodings[0].maxBitrate;
                    } else {
                        parameters.encodings[0].maxBitrate = _aBitRate * 1000;
                    }
                }
            }

            sender.setParameters(parameters)
                .then(() => {

                })
                .catch(e => console.error(e));
        }
    });
}

function debugLog(message) {
    console.log(message);
    msg = message;
    if (logHUBready)
        logHUB.invoke("Log", user, JSON.stringify(msg)).catch(function (err) {
            return console.error('COULD NOT SEND TO SERVER:' + err.toString());
        });
}

var repeatInterval = 2000; // 2000 ms == 2 seconds
getStats(pc, function (result) {
    $("#statList").empty();
    //document.getElementById("statList").children().remove();
    var li;
    li = document.createElement("li");
    li.textContent = "Transport : " + result.connectionType.transport;
    document.getElementById("statList").appendChild(document.createElement("li"));

    li = document.createElement("li");
    li.textContent = "Bandwidth Speed : " + result.bandwidth.speed ;
    document.getElementById("statList").appendChild(li);

    //result.connectionType.remote.ipAddress
    //result.connectionType.remote.candidateType
    //result.connectionType.transport

    result.bandwidth.speed // bandwidth download speed (bytes per second)

    // to access native "results" array
    result.results.forEach(function (item) {
        if (item.type === 'ssrc' && item.transportId === 'Channel-audio-1') {
            var packetsLost = item.packetsLost;
            var packetsSent = item.packetsSent;
            var audioInputLevel = item.audioInputLevel;
            var trackId = item.googTrackId; // media stream track id
            var isAudio = item.mediaType === 'audio'; // audio or video
            var isSending = item.id.indexOf('_send') !== -1; // sender or receiver

            console.log('SendRecv type', item.id.split('_send').pop());
            console.log('MediaStream track type', item.mediaType);
        }
    });
}, repeatInterval);


navigator.connection.addEventListener('change', logNetworkInfo);

function logNetworkInfo() {
    // Network type that browser uses

    debugLog('         bandwidth: ' + navigator.connection.bandwidth);
    debugLog('         metered: ' + navigator.connection.metered);

    debugLog('         type: ' + navigator.connection.type);

    // Effective bandwidth estimate
    debugLog('     downlink: ' + navigator.connection.downlink + 'Mb/s');

    // Effective round-trip time estimate
    debugLog('          rtt: ' + navigator.connection.rtt + 'ms');

    // Upper bound on the downlink speed of the first network hop
    debugLog('  downlinkMax: ' + navigator.connection.downlinkMax + 'Mb/s');

    // Effective connection type determined using a combination of recently
    // observed rtt and downlink values: ' +
    debugLog('effectiveType: ' + navigator.connection.effectiveType);

    // True if the user has requested a reduced data usage mode from the user
    // agent.
    debugLog('     saveData: ' + navigator.connection.saveData);
}

logNetworkInfo();