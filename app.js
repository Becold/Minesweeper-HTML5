
/*
 * Polyfill
 */

window.requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };


/*
 * Helpers
 */

// @return float Random number between min and max
function rand(min, max) { return (Math.random() * (max - min) + min); }

// @return boolean Return true if a and b is
function _between(value, range) { return (value >= range[0]) && (value <= range[1]); }


/*
 * Globals variables
 */

let gameboard_canvas = document.getElementById("canvas_gameboard");

let gameboard = gameboard_canvas.getContext("2d"); // Background game board

let _ = {
    // Tick game
    tick: 0,

    // Player score
    score: 0,

    // Hold the requestAnimationFrame
    loopRequestAnim: null,

    // 2D array of the game board
    board: null,

    // Settings of the game
    settings: {
        nb_mines: 10
    },

};

// Number of tiles on x-axe
let columns = 10;

// Number of tiles on y-axe
let rows = 10;


/*
 * Constants
 */

// Keyboard key code
const KEY = {
    MOUSE_LEFT: 1,
    MOUSE_RIGHT: 3
}

// Difficulty pressets
const DIFFICULTIES = {
    EASY: {
        NB_MINES: 10,
        WIDTH: 9,
        HEIGHT: 9
    },
    MEDIUM: {
        NB_MINES: 40,
        WIDTH: 16,
        HEIGHT: 16
    },
    HARD: {
        NB_MINES: 99,
        WIDTH: 30,
        HEIGHT: 16
    }
}

// Cell states
const CELL_STATE = {
    DISPLAYED: 0,
    NOT_DISPLAYED: 1,
    MARKED_MINE: 2,
    QUESTION_MARK: 3
}

// Background color
const BORDER_COLOR = "#000";

// Size of tiles width (in px)
const TILE_SIZE = 32;

// Border on a tile (in px)
const TILE_BORDER_SIZE = 0;

// Canvas info
const CANVAS = {
    // Canvas width (in px)
    WIDTH: columns * (TILE_SIZE + (2 * TILE_BORDER_SIZE)),

    // Canvas height (in px)
    HEIGHT: rows * (TILE_SIZE + (2 * TILE_BORDER_SIZE))
};


/*
 * Game engine
 */

let render = {

    init: function() {

        // Set gameboard canvas
        gameboard_canvas.width = CANVAS.WIDTH;
        gameboard_canvas.height = CANVAS.HEIGHT;

    },

    // Draw the background
    drawBackground: function() {

        // Gameboard grid
        if (TILE_BORDER_SIZE > 0) {
            gameboard.strokeStyle = BORDER_COLOR;
            gameboard.lineWidth = TILE_BORDER_SIZE;

            for (x = 0; x <= CANVAS.WIDTH; x += (TILE_SIZE + 2*TILE_BORDER_SIZE))
            {
                gameboard.moveTo(x, 0);
                gameboard.lineTo(x, CANVAS.HEIGHT);

                for (y = 0; y <= CANVAS.HEIGHT; y += (TILE_SIZE + 2*TILE_BORDER_SIZE))
                {
                    gameboard.moveTo(0, y);
                    gameboard.lineTo(CANVAS.WIDTH, y);
                }
            }
            gameboard.stroke();
        }

    },

    // Draw tetriminos (on the game board)
    drawPieces: function() {

        // Draw landed tetriminos
        for (let y = 0; y < rows; y++)
        {
            for (let x = 0; x < columns; x++)
            {
                this.drawCell(_.board[y][x]);
            }
        }

    },

    // Draw an image
    drawImage: function(name, x, y){

        gameboard.drawImage(
            assetmanager.get(name), // image
            x*TILE_SIZE + 2*x*TILE_BORDER_SIZE + TILE_BORDER_SIZE, // x-from
            y*TILE_SIZE + 2*y*TILE_BORDER_SIZE + TILE_BORDER_SIZE // y-from
        );

    },

    // Draw a block (on the game board)
    drawCell: function(cell) {

        // Draw the cell based on his state
        switch (cell.state)
        {
            case CELL_STATE.DISPLAYED:
                if (cell.solution == -1)
                {
                    this.drawImage('mine', cell.x, cell.y);
                }
                else
                {
                    let name = 'cell_' + cell.solution;
                    this.drawImage(name, cell.x, cell.y);
                }
                break;
            case CELL_STATE.NOT_DISPLAYED:
                this.drawImage('undisplayed_cell', cell.x, cell.y);
                break;
            case CELL_STATE.MARKED_MINE:
                this.drawImage('marked_cell', cell.x, cell.y);
                break;
            case CELL_STATE.QUESTION_MARK:
                this.drawImage('question_mark_cell', cell.x, cell.y);
                break;
        }

    },

    // Save the context
    save: function(ctx) { return ctx.save(); },

    // Restore the context
    restore: function(ctx) { return ctx.restore(); }
};

/*
 * Game core
 */

let game = {
    // Game initialization
    run: function() {
        // Setup eventlisteners
        evtlstmanager.init();

        // Game engine initisialization
        render.init();

        // Generate the empty gameboard
        this.start();

        this.loop();

    },

    start: function() {
        // @TODO Validations
        // Vérifier si nb_mines > rows*columns

        // Create the grid
        _.board = this.createGrid();

        // Generate mines and numbers
        this.generateMines();

        // Draw the board (only one time)
        render.drawPieces();
    },

    //
    createGrid: function() {
        let board = [];
        for (let y = 0; y < rows; y++)
        {
            board[y] = [];
            for (let x = 0; x < columns; x++)
            {
                board[y][x] = {
                    x: x,
                    y: y,
                    solution: 0,
                    state: CELL_STATE.NOT_DISPLAYED
                };
                render.drawCell(board[y][x]);
            }
        }
        return board;
    },

    //
    generateMines: function() {

        let mine;

        for (let i = 0; i < _.settings.nb_mines; i++)
        {
            // Search an empty cell
            while (true)
            {
                mine = {
                    y: Math.floor(rand(0, rows)),
                    x: Math.floor(rand(0, columns))
                }

                if (_.board[mine.y][mine.x].solution != -1)
                {
                    break;
                }
            }

            // Update the number on adjacentes cell
            this.getAdjacentsCells(mine.x, mine.y).forEach(function (cellAdj) {
                if (cellAdj.solution >= 0)
                {
                    cellAdj.solution++;
                }
            });
            _.board[mine.y][mine.x].solution = -1;
        }
    },

    //
    loose: function() {

        evtlstmanager.reset();

        // Affiche une alert en cas de défaite
        setTimeout(function() {
	        let resultat = confirm("Vous avez perdu! Souhaitez-vous rejouer une partie?");
	        if(resultat)
	        {
	            game.run();
	        }
        }, 100);

    },

    // Loop function (on each frame)
    loop: function() {

        _.tick++;
        this.update();
        this.draw();

        _.loopRequestAnim = window.requestAnimationFrame(this.loop.bind(this));

    },

    // Update the game board on each loop
    update: function() {

        // @TODO Process logic

    },

    // Draw everything on each loop (on the game board)
    draw: function() {

        // gameboard.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT); // @TODO Clear the canvas only when needed

        // @TODO Animations (?)
        // render.processAnimations();

    },

    //
    leftClick: function(posX, posY) {

        let coord = this.getCellsCoord(posX, posY);
        let y = coord.y;
        let x = coord.x;

        if (_.board[y][x].state != CELL_STATE.DISPLAYED &&
            _.board[y][x].state != CELL_STATE.MARKED_MINE)
        {
            _.board[y][x].state = CELL_STATE.DISPLAYED;

            // If this is a mine
            if (_.board[y][x].solution == -1)
            {
                render.drawCell(_.board[y][x]);
                this.loose();
            }
            else
            {
                render.drawCell(_.board[y][x]);

                // If this is an empty cell, display adjacents cells
                if(_.board[y][x].solution == 0)
                {
                    let cells = [_.board[y][x]];

                    while (cells.length != 0)
                    {
                        let self = this;
                        let newCells = [];
                        cells.forEach(function (cell) {
                            self.getAdjacentsCells(cell.x, cell.y).forEach(function (cellAdj) {
                                if (cellAdj.solution == 0 && cellAdj.state == CELL_STATE.NOT_DISPLAYED)
                                {
                                    newCells.push(cellAdj);
                                }
                                cellAdj.state = CELL_STATE.DISPLAYED;
                                render.drawCell(cellAdj);
                            });
                            cells = newCells;
                        });
                    }
                }
            }
        }

    },

    //
    rightClick: function(posX, posY) {

        let coord = this.getCellsCoord(posX, posY);
        let y = coord.y;
        let x = coord.x;

        if (_.board[y][x].state != CELL_STATE.DISPLAYED)
        {
            switch (_.board[y][x].state)
            {
                case CELL_STATE.NOT_DISPLAYED:
                    _.board[y][x].state = CELL_STATE.MARKED_MINE;
                    render.drawCell(_.board[y][x]);
                    break;
                case CELL_STATE.MARKED_MINE:
                    _.board[y][x].state = CELL_STATE.QUESTION_MARK;
                    render.drawCell(_.board[y][x]);
                    break;
                case CELL_STATE.QUESTION_MARK:
                    _.board[y][x].state = CELL_STATE.NOT_DISPLAYED;
                    render.drawCell(_.board[y][x]);
                    break;
            }
        }

    },

    // Get cells coord from mouse coords
    getCellsCoord: function(posX, posY) {

        return {
            x: Math.floor(posX / (TILE_SIZE + 2 * TILE_BORDER_SIZE)),
            y: Math.floor(posY / (TILE_SIZE + 2 * TILE_BORDER_SIZE)),
        }

    },

    getAdjacentsCells: function(posX, posY) {

        let cells = [];
        for (let j = -1; j <= 1; j++)
        {
            for (let k = -1; k <= 1; k++)
            {
                if (_between(posY+k, [0, rows-1]) && _between(posX+j, [0, columns-1]))
                {
                    cells.push(_.board[posY + k][posX + j]);
                }
            }
        }
        return cells;

    },
};


/*
 * Assets managers
 */

const assets = [
    {
        name: 'cell_0',
        path: 'assets/img/cell_0.jpg'
    },
    {
        name: 'cell_1',
        path: 'assets/img/cell_1.jpg'
    },
    {
        name: 'cell_2',
        path: 'assets/img/cell_2.jpg'
    },
    {
        name: 'cell_3',
        path: 'assets/img/cell_3.jpg'
    },
    {
        name: 'cell_4',
        path: 'assets/img/cell_4.jpg'
    },
    {
        name: 'cell_5',
        path: 'assets/img/cell_5.jpg'
    },
    {
        name: 'cell_6',
        path: 'assets/img/cell_6.jpg'
    },
    {
        name: 'cell_7',
        path: 'assets/img/cell_7.jpg'
    },
    {
        name: 'cell_8',
        path: 'assets/img/cell_8.jpg'
    },
    {
        name: 'marked_cell',
        path: 'assets/img/marked_cell.jpg'
    },
    {
        name: 'mine',
        path: 'assets/img/mine.jpg'
    },
    {
        name: 'question_mark_cell',
        path: 'assets/img/question_mark_cell.jpg'
    },
    {
        name: 'undisplayed_cell',
        path: 'assets/img/undisplayed_cell.jpg'
    }
];

let assetmanager = {

    queue: [],

    cache: {},

    count: {
        assetLoadSuccess: 0,
        assetLoadError: 0
    },

    init: function(callback) {

        this.callback = callback;

        for (let key in assets)
        {
            this.add(assets[key].name, assets[key].path);
        }

        this.downloadQueue(callback);

    },

    downloadQueue: function (callback) {

        for (let i = 0; i < this.queue.length; i++)
        {
            let img = new Image();
            img.assetName = this.queue[i].name;
            img.assetmanager = this;
            img.callback = callback;
            img.addEventListener('load', this.onLoadSuccess);
            img.addEventListener('error', this.onLoadError);
            img.src = this.queue[i].path;
        }

    },

    onLoadSuccess: function() {

        this.assetmanager.count.assetLoadSuccess++;
        this.assetmanager.cache[this.assetName] = this;

        if (this.assetmanager.queue.length == this.assetmanager.count.assetLoadSuccess + this.assetmanager.count.assetLoadError)
        {
            this.callback();
        }

    },

    onLoadError: function() {

        this.count.assetLoadError++;

    },

    add: function(name, path) {

        return this.queue.push({name: name, path: path});

    },

    get: function(name) {

        return this.cache[name];

    }

};


/*
 * Events listeners
 */

let evtlstmanager = {

    init: function() {
        this.setup();
    },

    setup: function() {

        // Disable right click on canvas
        this.onContextMenu = function(event) {
            event.preventDefault();
            return false;
        }

        // Mouse controller
        this.onMouseDown = function(event) {
            event.preventDefault();
            if (event.which == KEY.MOUSE_LEFT) {
                game.leftClick(event.offsetX, event.offsetY);
            } else if (event.which == KEY.MOUSE_RIGHT) {
                game.rightClick(event.offsetX, event.offsetY);
            }
        }

        gameboard_canvas.addEventListener("contextmenu", this.onContextMenu);
        gameboard_canvas.addEventListener("mousedown", this.onMouseDown);

    },

    reset: function() {

        gameboard_canvas.removeEventListener('mousedown', this.onMouseDown);
        this.onMouseDown = function() {};

    },

    onContextMenu: null,

    onMouseDown: null
};

(function() {
    // Load assets
    assetmanager.init(function() {
        // Run the game
        game.run();
    });

})();