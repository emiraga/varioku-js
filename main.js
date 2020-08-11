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

function bag_all() {
    return ~0;
}

function bag_items_in_both(bag1, bag2) {
    return bag1 & bag2;
}

function get_next_cell(row, col) {
    if (col === 8) {
        return [row + 1, 0];
    }
    return [row, col + 1];
}

const S = 9;

function minSumInNcells(n) {
    return n * (n + 1)/2;
}

function maxSumInNcells(n) {
    return (2 * S + 1 - n) * n / 2;
}

class Cell {
    constructor(name) {
        this.name = name;
        this.value = null;
        this.constraints = [];
    }
    add_constraint(constraint) {
        this.constraints.push(constraint);
        constraint._attach_cell(this);
    }
    set_value(val) {
        this.value = val;
        for (let c of this.constraints) {
            c._notify_value_set(this, val);
        }
    }
    unset_value(val) {
        // TODO: add assertion here
        this.value = null;
        for (let c of this.constraints) {
            c._notify_value_unset(this, val);
        }
    }
    get_available_options() {
        var options = bag_all();
        for (let c of this.constraints) {
            options = bag_items_in_both(options, c.get_available_for_cell(this));
        }
        return options;
    }
    debug() {
        console.log('===cell ', this.name);
        var cnstr = this.constraints.map(c => c.name).join(' ');
        console.log('Constraints', cnstr);
    }
}

class UniquenessConstraint {
    constructor(name) {
        this.name = name;
        this.available = bag_all();
        this.cells = [];
    }
    _attach_cell(cell) {
        this.cells.push(cell);
    }
    _notify_value_set(cell, val) {
        this.available = bag_remove(this.available, val);
    }
    _notify_value_unset(cell, val) {
        this.available = bag_add(this.available, val);
    }
    get_available_for_cell(_cell) {
        return this.available;
    }
}

class ExactSumUniquenessConstraint {
    constructor(name, sum) {
        this.name = name;
        this.sum = sum;
        this.empty = 0;
        this.available = bag_all();
        this.cells = [];
    }
    _attach_cell(cell) {
        this.cells.push(cell);
        this.empty++;
        // TODO: verify that cell is not set
    }
    _notify_value_set(cell, val) {
        this.available = bag_remove(this.available, val);
        this.sum -= val;
        this.empty--;
    }
    _notify_value_unset(cell, val) {
        this.available = bag_add(this.available, val);
        this.sum += val;
        this.empty++;
    }
    get_available_for_cell(_cell) {
        // TODO: assert empty >= 1
        var result = this.available;
        var upper_bound = this.sum - minSumInNcells(this.empty - 1);
        var lower_bound = this.sum - maxSumInNcells(this.empty - 1);
        for (var i=1; i < lower_bound; i++) {
            result = bag_remove(result, i);
        }
        for (var i = upper_bound+1; i <= S; i++) {
            result = bag_remove(result, i);
        }
        return result;
    }
}


let board = [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
];

let killer_mask = [
    'aaffqqtvv',
    'aaaggqtww',
    'bbhhpqttw',
    'bcihprtuw',
    'cciooruuu',
    'dcijmrsux',
    'ddjjmnssx',
    'eeellnsxx',
    'eekknnsyy',
];

let killer_capacity = {
    'a': 28, 'b': 16, 'c': 25, 'd': 13, 'e': 22, 'f': 3, 'g': 12,
    'h': 16, 'i': 10, 'j': 18, 'k': 13, 'l': 4, 'm': 15, 'n': 22,
    'o': 10, 'p': 5, 'q': 26, 'r': 12, 's': 17, 't': 29, 'u': 22,
    'v': 13, 'w': 15, 'x': 28, 'y': 11,
};


function main() {
    let row_constraints = [];
    for (var row=0;row<9;row++) {
        row_constraints.push(new UniquenessConstraint('r'+row));
    }
    let col_constraints = [];
    for (var col=0;col<9;col++) {
        col_constraints.push(new UniquenessConstraint('c'+col));
    }
    let box_constraints = [];
    for (var box=0;box<9;box++) {
        box_constraints.push(new UniquenessConstraint('b'+box));
    }
    let killer_constraints = {};
    for (var name of Object.keys(killer_capacity)) {
        killer_constraints[name] = new ExactSumUniquenessConstraint(
            'k_'+name, killer_capacity[name],
        );
    }
    let cells = new Array(81);
    for (var row=0;row<9;row++) {
        for (var col=0;col<9;col++) {
            var i = row * 9 + col;
            var cell = new Cell('(' + row + ',' + col + ')');
            cell.add_constraint(row_constraints[row]);
            cell.add_constraint(col_constraints[col]);
            let box = get_box_number(row, col);
            cell.add_constraint(box_constraints[box]);
            var killer_name = killer_mask[row][col];
            if (killer_name != '.') {
                cell.add_constraint(killer_constraints[killer_name]);
            }

            cells[i] = cell;
        }
    }
    for (var row=0;row<9;row++) {
        for (var col=0;col<9;col++) {
            if (board[row][col] > 0) {
                var i = row * 9 + col;
                cells[i].set_value(board[row][col]);
            }
        }
    }

    function show_options(bag) {
        var out = '['
        for (var num=1; num<=9; num++) {
            if (bag_check_exists(bag, num)) {
                out += num.toString();
            }
        }
        return out + ']';
    }
    function show_board() {
        console.log("======");
        for (var row=0; row<9; row++) {
            console.log(
                cells.slice(row*9, row*9 + 9).map(cell => cell.value || '.').join(' ')
            );
        }
    }

    let recursion_count = 0;
    let highest_depth = 0;
    function backtracking(row, col, depth) {
        recursion_count++;
        if (row == 9) {
            show_board();
            return;
        }
        if (depth > highest_depth) {
            highest_depth = depth;
            show_board();
            console.log('depth', depth);
        }
        let [next_row, next_col] = get_next_cell(row, col);

        var cell = cells[row * 9 + col];
        if (cell.value !== null) {
            backtracking(next_row, next_col, depth + 1);
        } else {
            var options = cell.get_available_options();

            for (let num=1; num<=9; num++) {
                if (bag_check_exists(options, num)) {
                    cell.set_value(num);
                    backtracking(next_row, next_col, depth + 1);
                    cell.unset_value(num);
                }
            }
        }
    }


    backtracking(0, 0, 0);
    console.log('Recursion count', recursion_count);
}

main();
