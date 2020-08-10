var logHUB = new signalR.HubConnectionBuilder().withUrl("/loghub").withAutomaticReconnect().build();
logHUB.serverTimeoutInMilliseconds = 1000 * 60 * 10; 
logHUB.start().then(function () {
    console.log('LogHUB Started Successfully');
}).catch(function (err) {
    return console.error(err.toString());
});

logHUB.on("DebugLog", function (remuser,message) {
    console.log('Recieving ...' + message);
    var msg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var li = document.createElement("li");
    li.textContent = msg;

    if (document.getElementById("user1").value === '') {
        document.getElementById("user1").value = remuser;
        document.getElementById("log1List").appendChild(li);
    }
    else {
        if (document.getElementById("user1").value === remuser) {
            document.getElementById("log1List").appendChild(li);
        }
        else {
            if (document.getElementById("user2").innerText === '') {
                document.getElementById("user2").value = remuser;
            }
            document.getElementById("log2List").appendChild(li);
        }
    }

});