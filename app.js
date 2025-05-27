const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    socket.on("move", (move) => {
        try {
            const currentTurn = chess.turn();
            if (
                (currentTurn === "w" && socket.id !== players.white) ||
                (currentTurn === "b" && socket.id !== players.black)
            ) {
                return; 
            }

            const result = chess.move(move);

            if (result) {
                io.emit("move", move); 
                io.emit("boardstate", chess.fen()); 
            } else {
                socket.emit("invalidMove", move);
            }
        } catch (error) {
            console.error("Move error:", error);
            socket.emit("invalidMove", move);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if (players.white === socket.id) delete players.white;
        if (players.black === socket.id) delete players.black;
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
