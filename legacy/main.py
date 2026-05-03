
from flask import Flask, request, jsonify, send_from_directory
from game import create_board, make_move, get_moves, checkmate, in_check
from ai import best_move

app = Flask(__name__, static_folder='.', template_folder='.')


# WARNING: Global state is not session-based. All users share the same game.
board = create_board()
white_turn = True

@app.route("/")
def index():
    return send_from_directory('.', 'index.html')

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory('.', path)

@app.route("/board")
def get_board():
    return jsonify(board)

@app.route("/move", methods=["POST"])

def move():
    global board, white_turn

    data = request.json
    # Error handling for missing keys
    if not data or "move" not in data or "mode" not in data:
        return jsonify({"error": "Missing move or mode in request", "board": board}), 400

    try:
        sx, sy, dx, dy = data["move"]
        mode = data["mode"]
    except Exception:
        return jsonify({"error": "Invalid move format", "board": board}), 400

    mv = ((sx, sy), (dx, dy))
    legal_moves = get_moves(board, white_turn)
    if mv not in legal_moves:
        return jsonify({"error": "Invalid move", "board": board})

    board = make_move(board, mv)

    # Pawn promotion (to Queen by default)
    piece = board[dx][dy]
    if (piece == 'P' and dx == 0):
        board[dx][dy] = 'Q'
    elif (piece == 'p' and dx == 7):
        board[dx][dy] = 'q'

    white_turn = not white_turn

    # Checkmate detection
    if checkmate(board, white_turn):
        return jsonify({"board": board, "gameOver": "CHECKMATE"})

    # Stalemate detection (no legal moves and not in check)
    if not get_moves(board, white_turn) and not in_check(board, white_turn):
        return jsonify({"board": board, "gameOver": "STALEMATE"})

    # AI move (AI always plays black)
    if mode == "ai" and not white_turn:
        ai_mv = best_move(board)
        if ai_mv:
            board = make_move(board, ai_mv)
            # Pawn promotion for AI
            sx2, sy2 = ai_mv[1]
            piece2 = board[sx2][sy2]
            if piece2 == 'p' and sx2 == 7:
                board[sx2][sy2] = 'q'
            white_turn = not white_turn

            # Checkmate after AI move
            if checkmate(board, white_turn):
                return jsonify({"board": board, "gameOver": "CHECKMATE"})
            # Stalemate after AI move
            if not get_moves(board, white_turn) and not in_check(board, white_turn):
                return jsonify({"board": board, "gameOver": "STALEMATE"})

    return jsonify({"board": board})

if __name__ == "__main__":
    app.run(debug=True)