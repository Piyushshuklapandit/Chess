const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null; 

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
        P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
    };
    return unicodePieces[piece];
};

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );

                const symbol = square.color === "w" 
                    ? square.type.toUpperCase() 
                    : square.type;
                pieceElement.innerText = getPieceUnicode(symbol);

                pieceElement.draggable = (playerRole === square.color) && (chess.turn() === playerRole);

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: colIndex };
                        e.dataTransfer.setData("text/plain", "");
                    } else {
                        e.preventDefault();
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece && sourceSquare) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
};

const handleMove = (source, target) => {
    if (playerRole === "spectator") {
        console.log("Spectators cannot make moves.");
        return;
    }

    if (chess.turn() !== playerRole) {
        console.log("Not your turn!");
        return;
    }

    const from = String.fromCharCode(97 + source.col) + (8 - source.row);
    const to = String.fromCharCode(97 + target.col) + (8 - target.row);

    const move = chess.move({ from, to, promotion: "q" }); 

    if (move) {
        renderBoard();
        socket.emit("move", move);
    } else {
        console.log("Invalid move attempted");
    }
};

socket.on("move", (move) => {
    const result = chess.move(move);
    if (result) {
        renderBoard();
    } else {
        console.log("Invalid move received from server:", move);
    }
});

socket.on("playerRole", (role) => {
    playerRole = role;
    console.log("Assigned role:", role);
    renderBoard(); 
});

socket.on("spectatorRole", () => {
    playerRole = "spectator";
    alert("You are a spectator. You can watch the game but cannot play.");
    renderBoard();
});
