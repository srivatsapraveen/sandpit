"use strict";

//var room = document.getElementById("roomInput").value;
//var user = document.getElementById("userInput").value;
//alert('User:' + user + ' in room:' + room);

var input = document.getElementById("messageInput");
// Execute a function when the user releases a key on the keyboard
input.addEventListener("keyup", function (event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("sendButton").click();
    }
});

var chatHUB = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

//Disable send button until chatHUB is established
document.getElementById("sendButton").disabled = true;

chatHUB.on("ReceiveMessage", function (user, message) {
    //alert('recieving...' + message + " from:" + user);
    var msg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var encodedMsg = user + " says " + msg;
    var li = document.createElement("li");
    li.textContent = encodedMsg;
    document.getElementById("messagesList").appendChild(li);
});

chatHUB.on("Notify", function (message) {
    //alert('Notification :' + message);
    var msg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var encodedMsg = message;
    var li = document.createElement("li");
    li.textContent = encodedMsg;
    document.getElementById("messagesList").appendChild(li);
});

chatHUB.start().then(function () {
    document.getElementById("sendButton").disabled = false;
    chatHUB.invoke("AddToGroup", room, user).catch(function (err) {
        return console.error(err.toString());
    });
}).catch(function (err) {
    return console.error(err.toString());
});


document.getElementById("sendButton").addEventListener("click", function (event) {
    //alert('sending...');
    var message = document.getElementById("messageInput").value;
    SendMessageToRoom(message, room, user);
    //SendMessageToAll(user, message);
    document.getElementById("messageInput").value = "";
    event.preventDefault();
});

function SendMessageToRoom(message, room) {
    chatHUB.invoke("SendMessageToGroup", message, room, user).catch(function (err) {
        return console.error(err.toString());
    });
}

function SendMessageToAll(user,message) {
    chatHUB.invoke("SendMessage", user, message).catch(function (err) {
        return console.error(err.toString());
    });
}


function SendPrivateMessage(user, message) {
    chatHUB.invoke("SendPrivateMessage", user, message).catch(function (err) {
        return console.error(err.toString());
    });
}


