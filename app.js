
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

var gameboard_canvas = document.getElementById("gameboard_canvas");
var gameboard = gameboard_canvas.getContext("2d"); // Background game board

var _ = {
    // Tick game
    tick: 0,

    // Player score
    score: {
        nb_discovered_cells: 0,
        nb_flags: 0,
        nb_marked_mine: 0
    },

    // Hold the requestAnimationFrame
    loopRequestAnim: null,

    // 2D array of the game board
    board: null,

    // Settings of the game
    settings: {
        nb_mines: 5,
        columns: 10, // Number of tiles on x-axe
        rows: 10 // Number of tiles on y-axe
    }

};

/*
 * Constants
 */

// Keyboard key code
var KEY = {
    MOUSE_LEFT: 1,
    MOUSE_RIGHT: 3
};

// Cell states
var CELL_STATE = {
    DISPLAYED: 0,
    NOT_DISPLAYED: 1,
    MARKED_MINE: 2,
    QUESTION_MARK: 3
};

// Size of tiles width (in px)
var TILE_SIZE = 32;

// Border on a tile (in px)
var TILE_BORDER_SIZE = 0;

// Canvas info
var CANVAS = {
    // Canvas width (in px)
    WIDTH: function() { return _.settings.columns * (TILE_SIZE + (2 * TILE_BORDER_SIZE)) },

    // Canvas height (in px)
    HEIGHT: function() { return _.settings.rows * (TILE_SIZE + (2 * TILE_BORDER_SIZE)) }
};


/*
 * Game engine
 */

var render = {
    hud: {
        settings: {
            init: function() {
                document.getElementById("_do_generate").addEventListener("click", render.hud.settings.onGenerate);
            },
            onGenerate: function(event) {
                var nbMines = Math.floor(Number(document.getElementById("_nb_mines").value));
                var width = Math.floor(Number(document.getElementById("_width").value));
                var height = Math.floor(Number(document.getElementById("_height").value));

                // Verification
                var error = "";
                if (width <= 0 || height <= 0) {
                    error += "La taille ne peut pas être négatif.\n";
                }
                if (width > 25 || height > 25) {
                    error += "Le plateau de jeu est trop grand.\n";
                }
                if (nbMines >= width * height) {
                    error += "Il y a trop de mines.\n";
                }
                if (nbMines <= 0) {
                    error += "Il n'y a pas assez de mines!\n";
                }

                // Display an error or Generate the board
                if (error != "") {
                    alert(error.slice(0, -2));
                }
                else {
                    _.settings.nb_mines = nbMines;
                    _.settings.columns = Math.max(width, height);
                    _.settings.rows = Math.min(width, height);

                    game.run();
                }

            }
        },
        statistics: {
            updateNbDiscoveredCells: function(value) {
                if (value != 0)
                {
                    value = Number(document.getElementById("_nb_discovered_cells").innerHTML) + value;
                    value = value <= 0 ? 0 : value;
                }
                else
                {
                    value = 0;
                }

                _.score.nb_discovered_cells = value;
                document.getElementById("_nb_discovered_cells").innerHTML = _.score.nb_discovered_cells;
            },

            updateNbFlags: function(value) {
                if (value != 0)
                {
                    value = Number(document.getElementById("_nb_flags").innerHTML) + value;
                    value = value <= 0 ? 0 : value;
                }
                else
                {
                    value = 0;
                }

                _.score.nb_flags = value;
                document.getElementById("_nb_flags").innerHTML = _.score.nb_flags;
            },

            updateNbMarkedMines: function(value) {
                if (value != 0)
                {
                    value = Number(document.getElementById("_nb_marked_mines").innerHTML) + value;
                    value = value <= 0 ? 0 : value;
                }
                else
                {
                    value = 0;
                }

                _.score.nb_marked_mine = value;
                document.getElementById("_nb_marked_mines").innerHTML = _.score.nb_marked_mine;
            }
        }
    },

    init: function() {

        // Set gameboard canvas
        gameboard_canvas.width = CANVAS.WIDTH();
        gameboard_canvas.height = CANVAS.HEIGHT();

        // Settings panel initisialization
        render.hud.settings.init();

    },

    // Draw all cells (on the game board)
    drawCells: function() {

        for (var y = 0; y < _.settings.rows; y++)
        {
            for (var x = 0; x < _.settings.columns; x++)
            {
                this.drawCell(_.board[y][x]);
            }
        }

    },

    // Draw a cell (on the game board)
    drawCell: function(cell) {

        var image_path = "undisplayed_cell";
        // Draw the cell based on his state
        switch (cell.state)
        {
            case CELL_STATE.DISPLAYED:
                image_path = (cell.solution == -1) ? "mine" : "cell_" + cell.solution;
                break;
            case CELL_STATE.NOT_DISPLAYED:
                image_path = "undisplayed_cell";
                break;
            case CELL_STATE.MARKED_MINE:
                image_path = "marked_cell";
                break;
            case CELL_STATE.QUESTION_MARK:
                image_path = "question_mark_cell";
                break;
        }

        this.drawImage(image_path, cell.x, cell.y);

    },

    // Draw an image
    drawImage: function(name, x, y){

        gameboard.drawImage(
            assetmanager.get(name), // image
            x*TILE_SIZE + 2*x*TILE_BORDER_SIZE + TILE_BORDER_SIZE, // x-from
            y*TILE_SIZE + 2*y*TILE_BORDER_SIZE + TILE_BORDER_SIZE // y-from
        );

    }

};

/*
 * Game core
 */

var game = {
    // Current game state
    state: null,

    // Game initialization
    run: function() {
        // Setup eventlisteners
        evtlstmanager.init();

        // Game engine initisialization
        render.init();

        // Generate the empty gameboard
        this.start();

        // Run loop game
        this.loop();

    },

    start: function() {
        // Reset score
        render.hud.statistics.updateNbFlags(0);
        render.hud.statistics.updateNbDiscoveredCells(0);
        render.hud.statistics.updateNbMarkedMines(0);

        // Create the grid
        _.board = this.createGrid();

        // Generate mines and numbers
        this.generateMines();

        // Draw the board (only one time)
        render.drawCells();
    },

    //
    createGrid: function() {
        var board = [];
        for (var y = 0; y < _.settings.rows; y++)
        {
            board[y] = [];
            for (var x = 0; x < _.settings.columns; x++)
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

        var mine;

        for (var i = 0; i < _.settings.nb_mines; i++)
        {
            // Search an empty cell
            while (true)
            {
                mine = {
                    y: Math.floor(rand(0, _.settings.rows)),
                    x: Math.floor(rand(0, _.settings.columns))
                };

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

    end: function(mot) {

        evtlstmanager.reset();

        // Affiche une alert en cas de défaite
        setTimeout(function() {
            var resultat = confirm("Vous avez " + mot + "! Souhaitez-vous rejouer une partie?");
            if(resultat)
            {
                game.run();
            }
        }, 100);

    },

    //
    loose: function() {
        this.end("perdu");
    },

    //
    win: function() {
        this.end("gagné");
    },

    checkForWin: function() {
        var totalCells = _.settings.rows * _.settings.columns;
        if (totalCells - _.settings.nb_mines == _.score.nb_discovered_cells)
        {
            this.win();
        }
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

        var coord = this.getCellsCoord(posX, posY);
        var y = coord.y;
        var x = coord.x;

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
                render.hud.statistics.updateNbDiscoveredCells(1);

                // If this is an empty cell, display adjacents cells
                if(_.board[y][x].solution === 0)
                {
                    var cells = [_.board[y][x]];

                    while (cells.length !== 0)
                    {
                        var self = this;
                        var newCells = [];
                        cells.forEach(function (cell)
                        {
                            self.getAdjacentsCells(cell.x, cell.y).forEach(function (cellAdj)
                            {
                                if (cellAdj.state == CELL_STATE.NOT_DISPLAYED)
                                {
                                    render.hud.statistics.updateNbDiscoveredCells(1);

                                    if (cellAdj.solution === 0 && cellAdj.state == CELL_STATE.NOT_DISPLAYED)
                                    {
                                        newCells.push(cellAdj);
                                    }
                                    cellAdj.state = CELL_STATE.DISPLAYED;
                                    render.drawCell(cellAdj);
                                }
                            });
                            cells = newCells;
                        });
                    }
                }
            }

            // Check if win
            this.checkForWin();
        }

    },

    //
    rightClick: function(posX, posY) {

        var coord = this.getCellsCoord(posX, posY);
        var y = coord.y;
        var x = coord.x;

        if (_.board[y][x].state != CELL_STATE.DISPLAYED)
        {
            switch (_.board[y][x].state)
            {
                case CELL_STATE.NOT_DISPLAYED:
                    _.board[y][x].state = CELL_STATE.MARKED_MINE;
                    render.drawCell(_.board[y][x]);
                    render.hud.statistics.updateNbMarkedMines(1);
                    render.hud.statistics.updateNbFlags(-1);
                    break;
                case CELL_STATE.MARKED_MINE:
                    _.board[y][x].state = CELL_STATE.QUESTION_MARK;
                    render.drawCell(_.board[y][x]);
                    render.hud.statistics.updateNbMarkedMines(-1);
                    render.hud.statistics.updateNbFlags(1);
                    break;
                case CELL_STATE.QUESTION_MARK:
                    _.board[y][x].state = CELL_STATE.NOT_DISPLAYED;
                    render.drawCell(_.board[y][x]);
                    render.hud.statistics.updateNbFlags(-1);
                    break;
            }
        }

    },

    // Get cells coord from mouse coords
    getCellsCoord: function(posX, posY) {

        return {
            x: Math.floor(posX / (TILE_SIZE + 2 * TILE_BORDER_SIZE)),
            y: Math.floor(posY / (TILE_SIZE + 2 * TILE_BORDER_SIZE)),
        };

    },

    getAdjacentsCells: function(posX, posY) {

        var cells = [];
        for (var j = -1; j <= 1; j++)
        {
            for (var k = -1; k <= 1; k++)
            {
                if (_between(posY+k, [0, _.settings.rows-1]) && _between(posX+j, [0, _.settings.columns-1]))
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

var assets = [
    {
        name: "cell_0",
        path: "assets/img/cell_0.jpg"
    },
    {
        name: "cell_1",
        path: "assets/img/cell_1.jpg"
    },
    {
        name: "cell_2",
        path: "assets/img/cell_2.jpg"
    },
    {
        name: "cell_3",
        path: "assets/img/cell_3.jpg"
    },
    {
        name: "cell_4",
        path: "assets/img/cell_4.jpg"
    },
    {
        name: "cell_5",
        path: "assets/img/cell_5.jpg"
    },
    {
        name: "cell_6",
        path: "assets/img/cell_6.jpg"
    },
    {
        name: "cell_7",
        path: "assets/img/cell_7.jpg"
    },
    {
        name: "cell_8",
        path: "assets/img/cell_8.jpg"
    },
    {
        name: "marked_cell",
        path: "assets/img/marked_cell.jpg"
    },
    {
        name: "mine",
        path: "assets/img/mine.jpg"
    },
    {
        name: "question_mark_cell",
        path: "assets/img/question_mark_cell.jpg"
    },
    {
        name: "undisplayed_cell",
        path: "assets/img/undisplayed_cell.jpg"
    }
];

var assetmanager = {

    queue: [],

    cache: {},

    count: {
        assetLoadSuccess: 0,
        assetLoadError: 0
    },

    init: function(callback) {

        this.callback = callback;

        for (var key in assets)
        {
            this.add(assets[key].name, assets[key].path);
        }

        this.downloadQueue(callback);

    },

    downloadQueue: function (callback) {

        for (var i = 0; i < this.queue.length; i++)
        {
            var img = new Image();
            img.assetName = this.queue[i].name;
            img.assetmanager = this;
            img.callback = callback;
            img.addEventListener("load", this.onLoadSuccess);
            img.addEventListener("error", this.onLoadError);
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

var evtlstmanager = {

    init: function() {
        this.setup();
    },

    setup: function() {

        // Disable right click on canvas
        this.onContextMenu = function(event) {
            event.preventDefault();
            return false;
        };

        // Mouse controller
        this.onMouseDown = function(event) {
            event.preventDefault();
            if (event.which == KEY.MOUSE_LEFT) {
                game.leftClick(event.offsetX, event.offsetY);
            } else if (event.which == KEY.MOUSE_RIGHT) {
                game.rightClick(event.offsetX, event.offsetY);
            }
        };

        gameboard_canvas.addEventListener("contextmenu", this.onContextMenu);
        gameboard_canvas.addEventListener("mousedown", this.onMouseDown);

    },

    reset: function() {

        gameboard_canvas.removeEventListener("mousedown", this.onMouseDown);
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