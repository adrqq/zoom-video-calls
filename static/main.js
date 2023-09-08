const socket = io("/");
const main__chat__window = document.getElementById("main__chat_window");
const videoGrids = document.getElementById("video-grids");
const myVideo = document.createElement("video");
const chat = document.getElementById("chat");
OtherUsername = "";
chat.hidden = true;

window.onload = () => {
    $(document).ready(function () {
        $("#getCodeModal").modal("show");
    });
};

var peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "3030",
});

let myVideoStream;
const peers = {};
var getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

sendMessage = (text) => {
    if (event.key === "Enter" && text.value != "") {
        socket.emit("messageSend", myName + ' : ' + text.value);
        text.value = "";
        main__chat_window.scrollTop = main__chat_window.scrollHeight;
    }
};

navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream, myName);

        socket.on("user-connected", (id, username) => {
            console.log("userId:" + id);
            connectToNewUser(id, stream, username);
            socket.emit("tellName", myName);
        });

        socket.on("user-disconnected", (id) => {
            console.log(peers);
            if (peers[id]) peers[id].close();
        });
    });
peer.on("call", (call) => {
    getUserMedia({ video: true, audio: true },
        function (stream) {
            call.answer(stream); // Answer the call with an A/V stream.
            const video = document.createElement("video");
            call.on("stream", function (remoteStream) {
                addVideoStream(video, remoteStream, OtherUsername);
            });
        },
        function (err) {
            console.log("Failed to get local stream", err);
        }
    );
});

peer.on("open", (id) => {
    socket.emit("join-room", roomId, id, myName);
});

socket.on("createMessage", (message) => {
    var ul = document.getElementById("messageAdd");
    var li = document.createElement("li");
    li.className = "message";
    li.appendChild(document.createTextNode(message));
    ul.appendChild(li);
});

socket.on("addName", (username) => {
    OtherUsername = username;
    console.log(username);
});

const removeUnusedElem = () => {
    allElem = videoGrids.getElementsByTagName("div");
    for (var i = 0; i < allElem.length; i++) {
        e = allElem[i].getElementsByTagName("video").length;
        if (e == 0) {
            allElem[i].remove();
        }
    }
};

const connectToNewUser = (userId, streams, myName) => {
    const call = peer.call(userId, streams);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        //       console.log(userVideoStream);
        addVideoStream(video, userVideoStream, myName);
    });
    call.on("close", () => {
        video.remove();
        removeUnusedElem();
    });
    peers[userId] = call;
};

const cancel = () => {
    $("#getCodeModal").modal("hide");
};

const copy = async () => {
    const roomId = document.getElementById("roomId").innerText;
    await navigator.clipboard.writeText("http://localhost:3030/join/" + roomId);
};

const inviteBox = () => {
    $("#getCodeModal").modal("show");
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        document.getElementById("mic").style.color = "red";
    } else {
        document.getElementById("mic").style.color = "white";
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

const videoMuteUnmute = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    console.log(getUserMedia);
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        document.getElementById("video").style.color = "red";
    } else {
        document.getElementById("video").style.color = "white";
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const showChat = () => {
    if (chat.hidden == false) {
        chat.hidden = true;
    } else {
        chat.hidden = false;
    }
};

const addVideoStream = (videoEl, stream, name) => {
    videoEl.srcObject = stream;
    videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play();
    });
    const h1 = document.createElement("h1");
    const h1name = document.createTextNode(name);
    h1.appendChild(h1name);
    const videoGrid = document.createElement("div");
    videoGrid.classList.add("video-grid");
    videoGrid.appendChild(h1);
    videoGrids.appendChild(videoGrid);
    videoGrid.append(videoEl);
    removeUnusedElem();
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
        for (let index = 0; index < totalUsers; index++) {
            document.getElementsByTagName("video")[index].style.width =
                100 / totalUsers + "%";
        }
    }
};
