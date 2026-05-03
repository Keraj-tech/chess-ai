import copy

# -------------------------
# CREATE BOARD
# -------------------------
def create_board():
    return [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        ['.','.','.','.','.','.','.','.'],
        ['.','.','.','.','.','.','.','.'],
        ['.','.','.','.','.','.','.','.'],
        ['.','.','.','.','.','.','.','.'],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ]

# -------------------------
def is_white(p):
    return p.isupper()

def in_bounds(x,y):
    return 0 <= x < 8 and 0 <= y < 8

# -------------------------
# MOVE GENERATION
# -------------------------
def get_pseudo_moves(board, white):
    moves = []

    for i in range(8):
        for j in range(8):
            p = board[i][j]

            if p == '.':
                continue

            if white != is_white(p):
                continue

            # PAWN
            if p.lower() == 'p':
                direction = -1 if is_white(p) else 1
                nx = i + direction

                if in_bounds(nx, j) and board[nx][j] == '.':
                    moves.append(((i,j),(nx,j)))

                for dy in [-1,1]:
                    ny = j + dy
                    if in_bounds(nx, ny):
                        if board[nx][ny] != '.' and is_white(board[nx][ny]) != is_white(p):
                            moves.append(((i,j),(nx,ny)))

            # ROOK
            elif p.lower() == 'r':
                moves += slide(board, i, j, [(1,0),(-1,0),(0,1),(0,-1)])

            # BISHOP
            elif p.lower() == 'b':
                moves += slide(board, i, j, [(1,1),(1,-1),(-1,1),(-1,-1)])

            # QUEEN
            elif p.lower() == 'q':
                moves += slide(board, i, j, [
                    (1,0),(-1,0),(0,1),(0,-1),
                    (1,1),(1,-1),(-1,1),(-1,-1)
                ])

            # KNIGHT
            elif p.lower() == 'n':
                jumps = [(2,1),(2,-1),(-2,1),(-2,-1),
                         (1,2),(1,-2),(-1,2),(-1,-2)]

                for dx,dy in jumps:
                    x,y = i+dx, j+dy
                    if in_bounds(x,y):
                        if board[x][y]=='.' or is_white(board[x][y])!=is_white(p):
                            moves.append(((i,j),(x,y)))

            # KING
            elif p.lower() == 'k':
                for dx in [-1,0,1]:
                    for dy in [-1,0,1]:
                        x,y = i+dx, j+dy
                        if in_bounds(x,y):
                            if board[x][y]=='.' or is_white(board[x][y])!=is_white(p):
                                moves.append(((i,j),(x,y)))

    return moves


def get_moves(board, white):
    legal_moves = []
    for m in get_pseudo_moves(board, white):
        new_board = make_move(board, m)
        if not in_check(new_board, white):
            dst_piece = board[m[1][0]][m[1][1]]
            if dst_piece.lower() == 'k':
                continue
            legal_moves.append(m)
    return legal_moves


# -------------------------
def slide(board, x, y, directions):
    moves = []
    p = board[x][y]

    for dx,dy in directions:
        nx,ny = x+dx, y+dy
        while in_bounds(nx,ny):
            if board[nx][ny] == '.':
                moves.append(((x,y),(nx,ny)))
            else:
                if is_white(board[nx][ny]) != is_white(p):
                    moves.append(((x,y),(nx,ny)))
                break
            nx += dx
            ny += dy

    return moves


# -------------------------
# APPLY MOVE
# -------------------------
def make_move(board, move):
    new_board = copy.deepcopy(board)
    (sx,sy),(dx,dy) = move
    new_board[dx][dy] = new_board[sx][sy]
    new_board[sx][sy] = '.'
    return new_board


# -------------------------
# CHECK SYSTEM
# -------------------------
def find_king(board, white):
    k = 'K' if white else 'k'
    for i in range(8):
        for j in range(8):
            if board[i][j] == k:
                return (i,j)

def in_check(board, white):
    king = find_king(board, white)
    if not king:
        return False

    for m in get_pseudo_moves(board, not white):
        (_, _), (dx,dy) = m
        if dx == king[0] and dy == king[1]:
            return True

    return False


def checkmate(board, white):
    if not in_check(board, white):
        return False

    for m in get_moves(board, white):
        if not in_check(make_move(board, m), white):
            return False

    return True
def main():
    board = create_board()
    white_turn = True

    moves = get_moves(board, white_turn)
    print("Possible moves:", moves)

if __name__ == "__main__":
    main()