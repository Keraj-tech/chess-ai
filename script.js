let selected = null;
let lastMove = null;
let possibleMoves = [];
let board = create_board();
let white_turn = true;
let aiThinking = false;

// online images
const pieceMap = {
    'P': "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
    'R': "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
    'N': "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
    'B': "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
    'Q': "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
    'K': "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",

    'p': "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
    'r': "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
    'n': "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
    'b': "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
    'q': "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
    'k': "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg"
};

// -------------------------
// CREATE BOARD
// -------------------------
function create_board() {
    return [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        ['.','.','.','.','.','.','.','.'],
        ['.','.','.','.','.','.','.','.'],
        ['.','.','.','.','.','.','.','.'],
        ['.','.','.','.','.','.','.','.'],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];
}

// -------------------------
// UTILS
// -------------------------
function is_white(p) {
    return p === p.toUpperCase() && p !== '.';
}

function in_bounds(x, y) {
    return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function getAIDepth() {
    const select = document.getElementById("difficulty");
    return select ? Number(select.value) || 2 : 2;
}

function toggleDifficultyVisibility() {
    const difficulty = document.getElementById("difficulty");
    if (!difficulty) return;
    difficulty.style.display = "inline-block";
}

// -------------------------
// MOVE GENERATION
// -------------------------
function get_pseudo_moves(board, white) {
    let moves = [];

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let p = board[i][j];

            if (p === '.') continue;
            if (white !== is_white(p)) continue;

            // PAWN
            if (p.toLowerCase() === 'p') {
                let direction = white ? -1 : 1;
                let nx = i + direction;

                if (in_bounds(nx, j) && board[nx][j] === '.') {
                    moves.push([[i,j],[nx,j]]);
                    // Double move
                    if ((white && i === 6) || (!white && i === 1)) {
                        let nnx = nx + direction;
                        if (in_bounds(nnx, j) && board[nnx][j] === '.') {
                            moves.push([[i,j],[nnx,j]]);
                        }
                    }
                }

                for (let dy of [-1,1]) {
                    let ny = j + dy;
                    if (in_bounds(nx, ny) && board[nx][ny] !== '.' && is_white(board[nx][ny]) !== white) {
                        moves.push([[i,j],[nx,ny]]);
                    }
                }
            }

            // ROOK
            else if (p.toLowerCase() === 'r') {
                moves = moves.concat(slide(board, i, j, [[1,0],[-1,0],[0,1],[0,-1]]));
            }

            // BISHOP
            else if (p.toLowerCase() === 'b') {
                moves = moves.concat(slide(board, i, j, [[1,1],[1,-1],[-1,1],[-1,-1]]));
            }

            // QUEEN
            else if (p.toLowerCase() === 'q') {
                moves = moves.concat(slide(board, i, j, [
                    [1,0],[-1,0],[0,1],[0,-1],
                    [1,1],[1,-1],[-1,1],[-1,-1]
                ]));
            }

            // KNIGHT
            else if (p.toLowerCase() === 'n') {
                let jumps = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
                for (let [dx,dy] of jumps) {
                    let x = i + dx, y = j + dy;
                    if (in_bounds(x,y) && (board[x][y] === '.' || is_white(board[x][y]) !== white)) {
                        moves.push([[i,j],[x,y]]);
                    }
                }
            }

            // KING
            else if (p.toLowerCase() === 'k') {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        let x = i + dx, y = j + dy;
                        if (in_bounds(x,y) && (board[x][y] === '.' || is_white(board[x][y]) !== white)) {
                            moves.push([[i,j],[x,y]]);
                        }
                    }
                }
            }
        }
    }

    return moves;
}

function get_moves(board, white) {
    let legal_moves = [];
    for (let m of get_pseudo_moves(board, white)) {
        let new_board = make_move(board, m);
        if (!in_check(new_board, white)) {
            let dst_piece = board[m[1][0]][m[1][1]];
            if (dst_piece && dst_piece.toLowerCase() === 'k') continue;
            legal_moves.push(m);
        }
    }
    return legal_moves;
}

function slide(board, x, y, directions) {
    let moves = [];
    let p = board[x][y];
    let white = is_white(p);

    for (let [dx,dy] of directions) {
        let nx = x + dx, ny = y + dy;
        while (in_bounds(nx, ny)) {
            if (board[nx][ny] === '.') {
                moves.push([[x,y],[nx,ny]]);
            } else {
                if (is_white(board[nx][ny]) !== white) {
                    moves.push([[x,y],[nx,ny]]);
                }
                break;
            }
            nx += dx;
            ny += dy;
        }
    }

    return moves;
}

// -------------------------
// APPLY MOVE
// -------------------------
function make_move(board, move) {
    let new_board = board.map(row => [...row]);
    let [[sx,sy],[dx,dy]] = move;
    new_board[dx][dy] = new_board[sx][sy];
    new_board[sx][sy] = '.';
    return new_board;
}

// -------------------------
// CHECK SYSTEM
// -------------------------
function find_king(board, white) {
    let k = white ? 'K' : 'k';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j] === k) return [i,j];
        }
    }
    return null;
}

function in_check(board, white) {
    let king = find_king(board, white);
    if (!king) return false;

    let opponent_moves = get_pseudo_moves(board, !white);
    for (let m of opponent_moves) {
        let [dx,dy] = m[1];
        if (dx === king[0] && dy === king[1]) return true;
    }
    return false;
}

function checkmate(board, white) {
    if (!in_check(board, white)) return false;
    let moves = get_moves(board, white);
    for (let m of moves) {
        if (!in_check(make_move(board, m), white)) return false;
    }
    return true;
}

// -------------------------
// AI
// -------------------------
const AI_MOVE_DELAY_MS = 2000;
const values = {
    'P':1,'R':5,'N':3,'B':3,'Q':9,'K':1000,
    'p':-1,'r':-5,'n':-3,'b':-3,'q':-9,'k':-1000
};

function evaluate(board) {
    let sum = 0;
    for (let row of board) {
        for (let p of row) {
            sum += values[p] || 0;
        }
    }
    return sum;
}

function minimax(board, depth, alpha, beta, maximizing) {
    if (depth === 0) return evaluate(board);

    let moves = get_moves(board, maximizing);

    if (maximizing) {
        let best = -Infinity;
        for (let m of moves) {
            let val = minimax(make_move(board, m), depth-1, alpha, beta, false);
            best = Math.max(best, val);
            alpha = Math.max(alpha, best);
            if (beta <= alpha) break;
        }
        return best;
    } else {
        let best = Infinity;
        for (let m of moves) {
            let val = minimax(make_move(board, m), depth-1, alpha, beta, true);
            best = Math.min(best, val);
            beta = Math.min(beta, best);
            if (beta <= alpha) break;
        }
        return best;
    }
}

function best_move(board, depth) {
    let best_val = Infinity;
    let best_mv = null;

    let moves = get_moves(board, false); // AI = black
    for (let m of moves) {
        let val = minimax(make_move(board, m), depth, -Infinity, Infinity, true);
        if (val < best_val) {
            best_val = val;
            best_mv = m;
        }
    }

    return best_mv;
}

// ---------------- DRAW ----------------
function drawBoard(board) {
    const table = document.getElementById("board");
    table.innerHTML = "";

    for (let i = 0; i < 8; i++) {
        let row = "<tr>";
        for (let j = 0; j < 8; j++) {
            let color = (i + j) % 2 === 0 ? "white" : "black";
            let piece = board[i][j];

            let extra = "";

            if (selected && selected[0] === i && selected[1] === j) {
                extra += " selected";
            }

            if (lastMove && (
                (lastMove[0] === i && lastMove[1] === j) ||
                (lastMove[2] === i && lastMove[3] === j)
            )) {
                extra += " last-move";
            }

            if (possibleMoves.some(m => m[1][0] === i && m[1][1] === j)) {
                extra += " possible";
            }

            let content = pieceMap[piece]
                ? `<img src="${pieceMap[piece]}" alt="${piece}">`
                : "";

            row += `<td class="${color}${extra}" data-i="${i}" data-j="${j}">${content}</td>`;
        }
        row += "</tr>";
        table.innerHTML += row;
    }
}

function handleBoardClick(event) {
    if (aiThinking) return;
    const cell = event.target.closest('td[data-i][data-j]');
    if (!cell) return;
    const i = Number(cell.dataset.i);
    const j = Number(cell.dataset.j);
    clickCell(i, j);
}

// ---------------- CLICK ----------------
function clickCell(i, j) {
    if (!selected) {
        // Select piece
        let piece = board[i][j];
        if (piece !== '.' && is_white(piece) === white_turn) {
            selected = [i, j];
            // Show possible moves
            possibleMoves = get_moves(board, white_turn).filter(m => m[0][0] === i && m[0][1] === j);
            drawBoard(board);
        }
        return;
    }

    let mv = [[selected[0], selected[1]], [i, j]];

    let legal_moves = get_moves(board, white_turn);
    let isLegal = legal_moves.some(m => m[0][0] === mv[0][0] && m[0][1] === mv[0][1] && m[1][0] === mv[1][0] && m[1][1] === mv[1][1]);

    if (!isLegal) {
        // If clicking on another piece of same color, select it
        let piece = board[i][j];
        if (piece !== '.' && is_white(piece) === white_turn) {
            selected = [i, j];
            possibleMoves = get_moves(board, white_turn).filter(m => m[0][0] === i && m[0][1] === j);
            drawBoard(board);
            return;
        }
        // Invalid move
        selected = null;
        possibleMoves = [];
        drawBoard(board);
        return;
    }

    // Make move
    board = make_move(board, mv);
    lastMove = [selected[0], selected[1], i, j];

    // Pawn promotion
    let piece = board[i][j];
    if (piece === 'P' && i === 0) {
        board[i][j] = 'Q';
    } else if (piece === 'p' && i === 7) {
        board[i][j] = 'q';
    }

    white_turn = !white_turn;
    selected = null;
    possibleMoves = [];
    updateStatus();
    updateMoveIndicator();

    // Check game over
    if (checkmate(board, white_turn)) {
        showGameOver("checkmate");
        drawBoard(board);
        return;
    }

    if (get_moves(board, white_turn).length === 0 && !in_check(board, white_turn)) {
        showGameOver("stalemate");
        drawBoard(board);
        return;
    }

    // AI move
    let mode = document.getElementById("mode").value;
    if (mode === "ai" && !white_turn) {
        aiThinking = true;
        updateStatus();
        document.body.classList.add("ai-thinking");
        drawBoard(board);

        setTimeout(() => {
            let ai_mv = best_move(board, getAIDepth());
            aiThinking = false;
            document.body.classList.remove("ai-thinking");
            updateStatus();
            if (ai_mv) {
                board = make_move(board, ai_mv);
                lastMove = [ai_mv[0][0], ai_mv[0][1], ai_mv[1][0], ai_mv[1][1]];

                // Pawn promotion for AI
                let [sx2, sy2] = ai_mv[1];
                let piece2 = board[sx2][sy2];
                if (piece2 === 'p' && sx2 === 7) {
                    board[sx2][sy2] = 'q';
                }
                white_turn = !white_turn;
                updateStatus();
                // Don't update move indicator for AI moves
                // updateMoveIndicator();

                // Check game over after AI
                if (checkmate(board, white_turn)) {
                    showGameOver("checkmate");
                    drawBoard(board);
                    return;
                }
                if (get_moves(board, white_turn).length === 0 && !in_check(board, white_turn)) {
                    showGameOver("stalemate");
                    drawBoard(board);
                    return;
                }

                drawBoard(board);
            }
        }, AI_MOVE_DELAY_MS); // Slower AI response for a more human-like feel
    } else {
        drawBoard(board);
    }
}

// ---------------- LOAD ----------------
function loadBoard() {
    drawBoard(board);
}

// ---------------- GAME OVER ----------------
function showGameOver(type) {
    const mode = document.getElementById("mode").value;
    const gameOverText = document.getElementById("gameOverText");
    const gameOverDetail = document.getElementById("gameOverDetail");
    const box = document.querySelector(".game-over-box");

    box.classList.remove("win", "loss", "draw");

    if (type === "stalemate") {
        gameOverText.textContent = "Stalemate!";
        gameOverDetail.textContent = "No legal moves remain. The game ends in a draw.";
        box.classList.add("draw");
    } else {
        const winner = !white_turn ? "White" : "Black";
        if (mode === "ai") {
            if (winner === "White") {
                gameOverText.textContent = "You win!";
                gameOverDetail.textContent = "Black is checkmated. Well played!";
                box.classList.add("win");
            } else {
                gameOverText.textContent = "AI wins!";
                gameOverDetail.textContent = "White is checkmated. Try again for a stronger finish.";
                box.classList.add("loss");
            }
        } else {
            gameOverText.textContent = `${winner} wins!`;
            gameOverDetail.textContent = `${winner} delivered checkmate and wins the game.`;
            box.classList.add("win");
        }
    }

    document.getElementById("gameOverScreen").classList.remove("hidden");
}

// ---------------- RESET ----------------
function coordToSquare(coord) {
    const files = "abcdefgh";
    return `${files[coord[1]]}${8 - coord[0]}`;
}

function updateStatus() {
    const status = document.getElementById("currentPlayer");
    const mode = document.getElementById("mode").value;
    let text = white_turn ? "White" : "Black";
    if (mode === "ai") {
        if (aiThinking && !white_turn) {
            text = "Black (AI thinking...)";
        } else {
            text += white_turn ? " (You)" : " (AI)";
        }
    }
    status.textContent = text;
}

function updateMoveIndicator() {
    const moveText = document.getElementById("lastMoveText");
    if (lastMove) {
        const from = coordToSquare([lastMove[0], lastMove[1]]);
        const to = coordToSquare([lastMove[2], lastMove[3]]);
        moveText.textContent = `Last move: ${from} → ${to}`;
    } else {
        moveText.textContent = "Last move: none";
    }
}

function resetGame() {
    board = create_board();
    white_turn = true;
    selected = null;
    lastMove = null;
    possibleMoves = [];
    aiThinking = false;
    document.body.classList.remove("ai-thinking");
    document.getElementById("gameOverScreen").classList.add("hidden");
    toggleDifficultyVisibility();
    updateStatus();
    updateMoveIndicator();
    drawBoard(board);
}

// ---------------- START ----------------
document.addEventListener("DOMContentLoaded", function() {
    drawBoard(board);
    document.getElementById("board").addEventListener("click", handleBoardClick);
    document.getElementById("resetBtn").addEventListener("click", resetGame);
    document.getElementById("mode").addEventListener("change", () => {
        resetGame();
    });
    const difficulty = document.getElementById("difficulty");
    if (difficulty) {
        difficulty.addEventListener("change", () => {
            updateStatus();
        });
    }
    toggleDifficultyVisibility();
    updateStatus();
    updateMoveIndicator();
});