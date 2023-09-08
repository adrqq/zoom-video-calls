const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const url = require("url");
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

const path = require("path");

app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "static")));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "static", "index.html"));
});

app.get("/join", (req, res) => {
    res.redirect(
        url.format({
            pathname: `/join/${uuidv4()}`,
            query: req.query,
        })
    );
});

app.get("/joinold", (req, res) => {
    res.redirect(
        url.format({
            pathname: req.query.meeting_id,
            query: req.query,
        })
    );
});

app.get("/join/:rooms", (req, res) => {
    res.render("room", { roomId: req.params.rooms, myName: req.query.name });
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, id, myName) => {
        socket.join(roomId);
        socket.to(roomId).broadcast.emit("user-connected", id, myName);

        socket.on("messageSend", (message) => {
            console.log(message);
            io.to(roomId).emit("createMessage", message);
        });

        socket.on("tellName", (myName) => {
            console.log(myName);
            socket.to(roomId).broadcast.emit("addName", myName);
        });

        socket.on("disconnect", () => {
            socket.to(roomId).broadcast.emit("user-disconnected", id);
        });
    });
});

server.listen(3030);
