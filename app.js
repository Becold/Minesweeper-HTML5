(function() {
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
        }
    };

    // Number of tiles on x-axe
    let columns = 9;

    // Number of tiles on y-axe
    let rows = 9;


    /*
     * Constants
     */

    // Keyboard key code
    const KEY = {
        MOUSE_LEFT: 1,
        MOUSE_RIGHT: 3
    }

    // Blocks colors
    const COLORS = {
        EMPTY: -1,
        GRAYLIGHT: "#adb5bd",
        GRAY: "#343a40",
        RED: "#e03131",
        PINK: "#c2255c",
        PURPLE: "#9c36b5",
        VIOLET: "#6741d9",
        INDIGO: "#3b5bdb",
        BLUE: "#1b6ec2",
        CYAN: "#0c8599",
        TEAL: "#099268",
        GREEN: "#2f9e44",
        LIME: "#66a80f",
        YELLOW: "#f08c00",
        ORANGE: "#e8590c",
        WHITE: "#ffffff"
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
    const BACKGROUND_COLOR = COLORS.GRAYLIGHT;

    // Background color
    const BORDER_COLOR = COLORS.WHITE;

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

            // @TODO Utiliser des images plutôt que des couleurs

            // Gameboard background
            gameboard.fillStyle = BACKGROUND_COLOR;
            gameboard.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

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
                    this.drawBlock(x, y, _.board[y][x]);
                }
            }

        },

        // Draw an image
        drawImage: function(name, x, y){

            gameboard.drawImage(
                assetmanager.get(name), // image url
                x*TILE_SIZE + 2*x*TILE_BORDER_SIZE + TILE_BORDER_SIZE, // x-from
                y*TILE_SIZE + 2*y*TILE_BORDER_SIZE + TILE_BORDER_SIZE // y-from
            );

        },

        // Draw a block (on the game board)
        drawBlock: function(x, y, cell) {

            // @TODO Sert juste comme point de repere mais doit être enlever à terme
            gameboard.fillStyle = COLORS.GRAYLIGHT;
            gameboard.fillRect(
                x*TILE_SIZE + 2*x*TILE_BORDER_SIZE + TILE_BORDER_SIZE, // x-from
                y*TILE_SIZE + 2*y*TILE_BORDER_SIZE + TILE_BORDER_SIZE, // y-from
                TILE_SIZE, // width
                TILE_SIZE  // height
            );

            // Draw the cell based on his state
            switch (cell.state) 
            {
                case CELL_STATE.DISPLAYED:
                    if (cell.solution == -1)
                    {
                        this.drawImage('mine', x, y);
                    }
                    else
                    {
                        var name = 'cell_' + cell.solution;
                        this.drawImage(name, x, y);
                    }
                    break;
                case CELL_STATE.NOT_DISPLAYED:
                    this.drawImage('undisplayed_cell', x, y);
                    break;
                case CELL_STATE.MARKED_MINE:
                    this.drawImage('marked_cell', x, y);
                    break;
                case CELL_STATE.QUESTION_MARK:
                    this.drawImage('question_mark_cell', x, y);
                    break;
            }

        },

        drawCell: function(x, y, state) {

            // @TODO Permet de dessiner la CELL_STATE d'une cellule
            // @TODO Si c'est un chiffre, afficher le chiffre

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
        // Current game state
        state: null,

        // Game initialization
        run: function() {

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
                        solution: 0,
                        state: CELL_STATE.NOT_DISPLAYED
                    };
                    render.drawBlock(x, y, board[y][x]);
                }
            }
            return board;
        },

        // 
        generateMines: function() {

            for (let i = 0; i < _.settings.nb_mines; i++) 
            {
                console.log(i);

                // Search an empty cell
                while (true)
                {
                    var mine = {
                        y: Math.floor(rand(0, rows)),
                        x: Math.floor(rand(0, columns))
                    }

                    if (_.board[mine.y][mine.x].solution != -1)
                    {
                        console.log(mine);
                        break;
                    }
                }

                // Update the number on adjacentes cell
                for (let j = -1; j <= 1; j++)
                {
                    for (let k = -1; k <= 1; k++)
                    {
                        if (j == 0 && k == 0)
                        {
                            _.board[mine.y][mine.x].solution = -1;
                        }
                        else if (_between(mine.y+k, [0, rows-1]) && _between(mine.x+j, [0, columns-1]))
                        {
                            if (_.board[mine.y + k][mine.x + j].solution >= 0)
                            {
                                _.board[mine.y + k][mine.x + j].solution++;
                            }
                        }
                    }
                } 
            }

        },

        //
        loose: function() {

            // @TODO Vider les eventlistener

        },

        // Loop function (on each frame)
        loop: function() {

            _.tick++;
            this.update();
            this.draw();

            _.loopRequestAnim = window.requestAnimationFrame(this.loop.bind(this));

        },

        // Update the game board  on each loop
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
                    render.drawBlock(x, y, _.board[y][x]);
                    this.loose();
                }
                else
                {
                    render.drawBlock(x, y, _.board[y][x]);

                    // If this is an empty cell, display adjacents cells
                    if(_.board[y][x].solution == 0)
                    {
                        // @TODO Si c'est une cell vide, afficher les cell directement adjacentes (récursif)
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
                        render.drawBlock(x, y, _.board[y][x]);
                        break;
                    case CELL_STATE.MARKED_MINE:
                        _.board[y][x].state = CELL_STATE.QUESTION_MARK;
                        render.drawBlock(x, y, _.board[y][x]);
                        break;
                    case CELL_STATE.QUESTION_MARK:
                        _.board[y][x].state = CELL_STATE.NOT_DISPLAYED;
                        render.drawBlock(x, y, _.board[y][x]);
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

        }
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
            assetloaded: 0
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

            this.assetmanager.count.assetloaded++;
            this.assetmanager.cache[this.assetName] = this;

            if (this.assetmanager.queue.length == this.assetmanager.count.assetloaded) 
            {
                this.callback();
            }

        },

        onLoadError: function() {

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

    // Prevent right click on canvas
    gameboard_canvas.addEventListener("contextmenu", function(event) {
        event.preventDefault();
        return false;
    });

    gameboard_canvas.addEventListener("mousedown", function(event) {
        event.preventDefault();
        if (event.which == KEY.MOUSE_LEFT) {
            game.leftClick(event.offsetX, event.offsetY);
        } else if (event.which == KEY.MOUSE_RIGHT) {
            game.rightClick(event.offsetX, event.offsetY);
        }
    });

    // Run the game
    // game.run();
    assetmanager.init(function() {
        game.run();
    });

})();