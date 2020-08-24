///Basic RTC with local signalling https://jsfiddle.net/jib1/2yLakm60
//Mute Audio/Video https://jsfiddle.net/j1elo/n3tf0rtL/
//https://github.com/Kurento/experiments/blob/master/WebRTC/mute-tracks/mute-tracks.js (also has debug info for getstats())
// Dynamic resize - https://blog.mozilla.org/webrtc/fiddle-week-downscale-video-peerconnection/ - JSFiddle here https://jsfiddle.net/jib1/eL2byuw8/
//https://webrtc.github.io/samples/src/content/peerconnection/constraints/

//ondevicechanged
var _br = 60;var _fr = 15;var _bw;
var _resx = 240; var _resy = 320;

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
        maxHeight: _resx,
        maxWidth: _resy
    },
    optional: []
};

const pc = new RTCPeerConnection(pcConfig);

pc.ontrack = ({ streams }) => {
    debugLog('on track - setting remote stream'+ streams.track.type);
    remoteVideo.srcObject = streams[0];
    remoteVideo.onloadedmetadata = function (e) {
        remoteVideo.play();
    };
}

pc.oniceconnectionstatechange = () => {
    debugLog('on iceconnectionstatechnge:'+ pc.iceConnectionState);
    if (pc.iceConnectionState === 'disconnected') remoteVideo.srcObject = null;
}
pc.onicecandidate = ({ candidate }) => {
    //debugLog('on icecandidate', candidate);
    send({ candidate });
}
pc.onnegotiationneeded = async () => {
    await pc.setLocalDescription(await pc.createOffer());
    debugLog('on onnegotiationneeded:' + pc.iceConnectionState);
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

function onbrchange() {
    _br = $("#bitrate").children("option:selected").val();
    setBitRate(_br, _br);
}

function onfrchange() {
    _fr = $("#framerate").children("option:selected").val();
    setFrameRate(_fr, _fr);
}

function onbwchange() {
    _bw = $("#bandwidth").children("option:selected").val();
    setBandwidth(_bw, _bw);
}

function onreschange() {
    alert($("#res").children("option:selected").val());
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
    setBitRate(_br, _br);
    setFrameRate(_fr, _fr);
}

function updateTracks() {
    if (localStream !== undefined) {
        if (showvideo) { vTrack.enabled = true; } else { vTrack.enabled = false; }
        if (showaudio) { aTrack.enabled = true; } else { aTrack.enabled = false; }
    }
}

function setFrameRate(_vFrameRate, _aFrameRate) {
    //alert(_vFrameRate);
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
    //alert(_vBitRate);
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

function printstats() {
    getStats(pc);
}
var repeatInterval = 2000; // 2000 ms == 2 seconds

getStats(pc, function (result) {
    //https://github.com/muaz-khan/getStats/blob/master/index.html
    //console.log(JSON.stringify(result));
    //alert('whoohoo');
    //$("#statList").empty();
    //document.getElementById("statList").children().remove();
    let statsOutput = "";

    if (result.connectionType.remote.candidateType.indexOf('relayed') !== -1) {
        result.connectionType.remote.candidateType = 'TURN';
    }
    else {
        result.connectionType.remote.candidateType = 'STUN';
    }

    if (result.connectionType.local.candidateType.indexOf('relayed') !== -1) {
        result.connectionType.local.candidateType = 'TURN';
    }
    else {
        result.connectionType.local.candidateType = 'STUN';
    }

    statsOutput += `<div class="row"><div class="col-md-4">`;
    statsOutput += `<h2>Shared</h2>\n<strong>isOfferer :</strong> ${result.isOfferer}<br>\n`
    statsOutput += `<strong>Bandwidth:</strong> ${bytesToSize(result.bandwidth.speed)}<br>\n`
    statsOutput += `<strong>Audio Latency:</strong> ${result.audio.latency + 'ms'}<br>\n`
    statsOutput += `<strong>Video Latency:</strong> ${result.video.latency + 'ms'}<br>\n`
    statsOutput += `<strong>ConnectionType :</strong> ${result.connectionType.systemNetworkType}<br>\n`
    statsOutput += `<strong>Encryption :</strong> ${result.encryption}<br>\n`

    statsOutput += `</div><div class="col-md-4">`;
    statsOutput += `<h2>Local</h2>\n<strong>candidateType :</strong> ${result.connectionType.local.candidateType}<br>\n`
    statsOutput += `<strong>transport :</strong> ${result.connectionType.local.transport.join(', ')}<br>\n`
    statsOutput += `<strong>ipAddress :</strong> ${result.connectionType.local.ipAddress.join(', ')}<br>\n`
    statsOutput += `<strong>networkType :</strong> ${result.connectionType.local.networkType}<br>\n`

    statsOutput += `\n<strong>Resolution :</strong> ${result.resolutions.send.width + 'x' + result.resolutions.send.height}<br>\n`
    statsOutput += `<strong>FrameRate :</strong> ${bytesToSize(result.video.send.framerateMean)}<br>\n`
    statsOutput += `<strong>BitRate :</strong> ${bytesToSize(result.video.send.bitrateMean)}<br>\n`
    statsOutput += `<strong>Audio Bandwidth :</strong> ${bytesToSize(result.audio.send.availableBandwidth)}<br>\n`
    statsOutput += `<strong>Video Bandwidth :</strong> ${bytesToSize(result.video.send.availableBandwidth)}<br>\n`

    statsOutput += `</div><div class="col-md-4">`;
    statsOutput += `<h2>Remote</h2>\n<strong>candidateType :</strong> ${result.connectionType.remote.candidateType}<br>\n`
    statsOutput += `<strong>transport :</strong> ${result.connectionType.remote.transport.join(', ')}<br>\n`
    statsOutput += `<strong>ipAddress :</strong> ${result.connectionType.remote.ipAddress.join(', ')}<br>\n`
    statsOutput += `<strong>networkType :</strong> ${result.connectionType.remote.networkType}<br>\n`

    statsOutput += `<strong>Resolution :</strong> ${result.resolutions.recv.width + 'x' + result.resolutions.recv.height}<br>\n`
    statsOutput += `<strong>FrameRate :</strong> ${bytesToSize(result.video.recv.framerateMean)}<br>\n`
    statsOutput += `<strong>BitRate :</strong> ${bytesToSize(result.video.recv.bitrateMean)}<br>\n`
    statsOutput += `<strong>Audio Bandwidth :</strong> ${bytesToSize(result.audio.recv.availableBandwidth)}<br>\n`
    statsOutput += `<strong>Video Bandwidth :</strong> ${bytesToSize(result.video.recv.availableBandwidth)}<br>\n`
    statsOutput += `</div></div>`;


    // to access native "results" array
    result.results.forEach(function (item) {
        //console.log(JSON.stringify(item));
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
    document.querySelector(".stats-box").innerHTML = statsOutput;

}, repeatInterval);


//window.setInterval(function () {
//    pc.getStats(null).then(stats => {
//        let statsOutput = "";


//        var rpt_showAll = false; var stat_showAll = false;
//        var rpt_options = ['media-source', 'transport', 'remote-inbound-rtp', 'peer-connection', 'outbound-rtp', 'stream', 'track']; //'codec','certificate','candidate-pair', left out
//        var stat_options = ['kind', 'remoteSource', 'ended','detached','frameWidth','frameHeight','framesSent','dtlsState','bytesSent','bytesRecieved'];

//        stats.forEach(report => {
//            if (rpt_options.indexOf(report.type) > -1 || rpt_showAll) {
//                statsOutput += `<h2>Report: ${report.type}</h2>\n<strong>ID:</strong> ${report.id}<br>\n` +
//                    `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;

//                //statsOutput += `<h2>Bandwidth: ${report.bandwidth.speed}</h2>`;
//                // Now the statistics for this report; we intentially drop the ones we
//                // sorted to the top above

//                Object.keys(report).forEach(statName => {
//                    if (stat_options.indexOf(statName) > -1 || stat_showAll) {
//                        if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
//                            statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
//                        }
//                    }
//                });
//            }
//        });

//        document.querySelector(".stats-box").innerHTML = statsOutput;
//    });
//}, 1000);


function bytesToSize(bytes) {
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes <= 0) {
        return '0 Bytes';
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);

    if (!sizes[i]) {
        return '0 Bytes';
    }

    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}