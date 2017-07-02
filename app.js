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

    // Number of tiles on x-axe
    const COLUMNS = 9;

    // Number of tiles on y-axe
    const ROWS = 9;

    // Size of tiles width (in px)
    const TILE_SIZE = 40;

    // Border on a tile (in px)
    const TILE_BORDER_SIZE = 1;

    // Canvas info
    const CANVAS = {
        // Canvas width (in px)
        WIDTH: COLUMNS * (TILE_SIZE + (2 * TILE_BORDER_SIZE)),

        // Canvas height (in px)
        HEIGHT: ROWS * (TILE_SIZE + (2 * TILE_BORDER_SIZE))
    };


    /*
     * Globals letiables
     */

    let boardgame_canvas = document.getElementById("canvas_gameboard");

    let boardgame = boardgame_canvas.getContext("2d"); // Background game board

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
            nb_mines: 0
        }
    };


    /*
     * Game engine
     */

     let render = {

        init: function() {

            // Set boardgame canvas
            boardgame_canvas.width = CANVAS.WIDTH;
            boardgame_canvas.height = CANVAS.HEIGHT;


        },

        // Draw the background
        drawBackground: function() {

            // @TODO Utiliser des images plutôt que des couleurs

            // Gameboard background
            boardgame.fillStyle = BACKGROUND_COLOR;
            boardgame.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

            // Gameboard grid
            if (TILE_BORDER_SIZE > 0) {
                boardgame.strokeStyle = BORDER_COLOR;
                boardgame.lineWidth = TILE_BORDER_SIZE;

                for (x = 0; x <= CANVAS.WIDTH; x += (TILE_SIZE + 2*TILE_BORDER_SIZE))
                {
                    boardgame.moveTo(x, 0);
                    boardgame.lineTo(x, CANVAS.HEIGHT);

                    for (y = 0; y <= CANVAS.HEIGHT; y += (TILE_SIZE + 2*TILE_BORDER_SIZE))
                    {
                        boardgame.moveTo(0, y);
                        boardgame.lineTo(CANVAS.WIDTH, y);
                    }
                }
                boardgame.stroke();
            }

        },

        // Draw tetriminos (on the game board)
        drawPieces: function() {

            // Draw landed tetriminos
            for (let y = 0; y < ROWS; y++)
            {
                for (let x = 0; x < COLUMNS; x++)
                {
                    this.drawBlock(x, y, _.board[y][x]);
                }
            }

        },

        // Draw a block (on the game board)
        drawBlock: function(x, y, cell) {

            // @TODO Sert juste comme point de repere mais doit être enlever à terme
            boardgame.fillStyle = COLORS.GRAYLIGHT;
            boardgame.fillRect(
                x*TILE_SIZE + 2*x*TILE_BORDER_SIZE + TILE_BORDER_SIZE, // x-from
                y*TILE_SIZE + 2*y*TILE_BORDER_SIZE + TILE_BORDER_SIZE, // y-from
                TILE_SIZE, // width
                TILE_SIZE  // height
            );

            // Draw the cell based on his state
            switch (cell.state) 
            {
                case CELL_STATE.DISPLAYED:
                    // @TODO Dessiner une case découverte
                    // @TODO Afficher la mine (si -1)
                    // @TODO Afficher le chiffre (si plus grand que 0)
                    break;
                case CELL_STATE.NOT_DISPLAYED:
                    // @TODO Dessiner une case non découverte
                    break;
                case CELL_STATE.MARKED_MINE:
                    // @TODO Dessiner une case non découverte
                    // @TODO + afficher une croix (image)
                    break;
                case CELL_STATE.QUESTION_MARK:
                    // @TODO Dessiner une case non découverte
                    // @TODO + afficher une mine (image)
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

            render.drawBackground();
            this.loop();

        },

        start: function() {
            // Generate empty board
            _.board = [];
            for (let y = 0; y < ROWS; y++)
            {
                _.board[y] = [];
                for (let x = 0; x < COLUMNS; x++)
                {
                    _.board[y][x] = {
                        solution: 0,
                        state: CELL_STATE.NOT_DISPLAYED
                    };
                }
            }

            // Generate mines and numbers
            for (let i = 0; i < _.settings.nb_mines; i++) 
            {
                // @TODO Placer les mines de manieres random   
            }

            // Draw the board (only one time)
            render.drawPieces();
        },

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

            // boardgame.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT); // @TODO Clear the canvas only when needed

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
                    this.loose();
                }
                else
                {
                    // @TODO Si c'est une cell vide, afficher les cell directement adjacentes (récursif)
                    // @TODO Afficher le chiffre
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
                        break;
                    case CELL_STATE.MARKED_MINE:
                        _.board[y][x].state = CELL_STATE.QUESTION_MARK;
                        break;
                    case CELL_STATE.QUESTION_MARK:
                        _.board[y][x].state = CELL_STATE.NOT_DISPLAYED;
                        break;
                }

                // @TODO Update visuellement la cell
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
     * Events listeners
     */

    // Prevent right click on canvas
    boardgame_canvas.addEventListener("contextmenu", function(event) {
        event.preventDefault();
        return false;
    });

    boardgame_canvas.addEventListener("mousedown", function(event) {
        event.preventDefault();
        if (event.which == KEY.MOUSE_LEFT) {
            game.leftClick(event.offsetX, event.offsetY);
        } else if (event.which == KEY.MOUSE_RIGHT) {
            game.rightClick(event.offsetX, event.offsetY);
        }
    });

    // Run the game
    game.run();

})();