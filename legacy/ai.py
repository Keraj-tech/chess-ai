
import math
from game import get_moves, make_move

# -------------------------
# EVALUATION
# -------------------------
values = {
    'P':1,'R':5,'N':3,'B':3,'Q':9,'K':1000,
    'p':-1,'r':-5,'n':-3,'b':-3,'q':-9,'k':-1000
}

def evaluate(board):
    return sum(values.get(p,0) for row in board for p in row)

# -------------------------
# MINIMAX
# -------------------------
def minimax(board, depth, alpha, beta, maximizing):
    if depth == 0:
        return evaluate(board)

    moves = get_moves(board, maximizing)

    if maximizing:
        best = -math.inf
        for m in moves:
            best = max(best, minimax(make_move(board,m), depth-1, alpha, beta, False))
            alpha = max(alpha, best)
            if beta <= alpha:
                break
        return best
    else:
        best = math.inf
        for m in moves:
            best = min(best, minimax(make_move(board,m), depth-1, alpha, beta, True))
            beta = min(beta, best)
            if beta <= alpha:
                break
        return best

# -------------------------
# BEST MOVE
# -------------------------
def best_move(board):
    best_val = math.inf
    best_mv = None

    for m in get_moves(board, False):  # AI = black
        val = minimax(make_move(board,m), 3, -math.inf, math.inf, True)
        if val < best_val:
            best_val = val
            best_mv = m

    return best_mv