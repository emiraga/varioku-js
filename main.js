function get_box_number(row, col) {
    return 3 * Math.trunc(row / 3) + Math.trunc(col / 3);
}

function bag_add(bag, num) {
    return bag | (1 << num);
}

function bag_remove(bag, num) {
    return bag & ~(1 << num);
}

function bag_check_exists(bag, num) {
    return (bag & (1 << num)) > 0;
}

function get_next_cell(row, col) {
    if (col === 8) {
        return [row + 1, 0];
    }
    return [row, col + 1];
}

let used_in_row = new Array(9);
let used_in_col = new Array(9);
let used_in_box = new Array(9);

function sudoku_can_be_placed(row, col, val) {
    if (bag_check_exists(used_in_row[row], val)) {
        return false;
    }
     if (bag_check_exists(used_in_col[col], val)) {
        return false;
    }
    let box = get_box_number(row, col);
    if (bag_check_exists(used_in_box[box], val)) {
        return false;
    }
    return true;
}

let board = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9],
];

function show_board() {
    console.log("======");
    console.log(
        board.map(brow => brow.join(' ')).join('\n')
    );
}

function sudoku_add(row, col, val) {
    board[row][col] = val;
    used_in_row[row] = bag_add(used_in_row[row], val);
    used_in_col[col] = bag_add(used_in_col[col], val);
    let box = get_box_number(row, col);
    used_in_box[box] = bag_add(used_in_box[box], val);
}

function sudoku_remove(row, col, val) {
    board[row][col] = 0;
    used_in_row[row] = bag_remove(used_in_row[row], val);
    used_in_col[col] = bag_remove(used_in_col[col], val);
    let box = get_box_number(row, col);
    used_in_box[box] = bag_remove(used_in_box[box], val);
}

function backtracking(row, col, depth) {
    if (row == 9) {
        show_board();
        return;
    }
    let [next_row, next_col] = get_next_cell(row, col);

    if (board[row][col] > 0) {
        backtracking(next_row, next_col, depth + 1);
    } else {
        for (let num=1; num<=9; num++) {
            if (sudoku_can_be_placed(row, col, num)) {
                sudoku_add(row, col, num);
                backtracking(next_row, next_col, depth + 1);
                sudoku_remove(row, col, num);
            }
        }
    }
}

for (var row=0; row<9; row++) {
    for (var col=0; col<9; col++) {
        if (board[row][col] > 0) {
            sudoku_add(row, col, board[row][col]);
        }
    }
}

backtracking(0, 0, 0);
