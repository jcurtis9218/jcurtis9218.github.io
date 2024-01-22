/*
game.js for Perlenspiel 3.3.x
Last revision: 2022-03-15 (BM)

Perlenspiel is a scheme by Professor Moriarty (bmoriarty@wpi.edu).
This version of Perlenspiel (3.3.x) is hosted at <https://ps3.perlenspiel.net>
Perlenspiel is Copyright © 2009-22 Brian Moriarty.
This file is part of the standard Perlenspiel 3.3.x devkit distribution.

Perlenspiel is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Perlenspiel is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You may have received a copy of the GNU Lesser General Public License
along with the Perlenspiel devkit. If not, see <http://www.gnu.org/licenses/>.
*/

/*
This JavaScript file is a template for creating new Perlenspiel 3.3.x games.
Any unused event-handling function templates can be safely deleted.
Refer to the tutorials and documentation at <https://ps3.perlenspiel.net> for details.
*/

/*
The following comment lines are for JSHint <https://jshint.com>, a tool for monitoring code quality.
You may find them useful if your development environment is configured to support JSHint.
If you don't use JSHint (or are using it with a configuration file), you can safely delete these two lines.
*/

/* jshint browser : true, devel : true, esversion : 6, freeze : true */
/* globals PS : true */

"use strict"; // Do NOT remove this directive!

/*
PS.init( system, options )
Called once after engine is initialized but before event-polling begins.
This function doesn't have to do anything, although initializing the grid dimensions with PS.gridSize() is recommended.
If PS.grid() is not called, the default grid dimensions (8 x 8 beads) are applied.
Any value returned is ignored.
[system : Object] = A JavaScript object containing engine and host platform information properties; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/
const gridSize = 3
const gridWidth = gridSize
const gridHeight = gridSize
const backgroundColor = PS.makeRGB(0, 0, 80)

PS.init = function( system, options ) {
	// Uncomment the following code line
	// to verify operation:

	// PS.debug( "PS.init() called\n" );

	// This function should normally begin
	// with a call to PS.gridSize( x, y )
	// where x and y are the desired initial
	// dimensions of the grid.
	// Call PS.gridSize() FIRST to avoid problems!
	// The sample call below sets the grid to the
	// default dimensions (8 x 8).
	// Uncomment the following code line and change
	// the x and y parameters as needed.

	PS.gridSize( gridWidth, gridHeight );

	// This is also a good place to display
	// your game title or a welcome message
	// in the status line above the grid.
	// Uncomment the following code line and
	// change the string parameter as needed.

	// PS.statusText( "Game" );

	// Add any other initialization code you need here.
    newBoard()
    renderBoard()
    PS.debug("Use the arrow keys to shift the row/column you're hovering over one space in the given direction. See if you can line up all the colors! (Side note: I'm really bad at Rubik's Cubes and I have no idea if this is actually solvable.)")


};

let grid = []
let colorCandidates = [
    PS.COLOR_RED,
    PS.COLOR_ORANGE,
    PS.COLOR_YELLOW,
    PS.COLOR_GREEN,
    PS.COLOR_BLUE,
    PS.COLOR_VIOLET
]
let colors = []
for (let i = 0; i < gridSize; i++) {
    colors.push(colorCandidates[i])
}


function colorToString(color) {
    if (color === PS.COLOR_RED) {
        return "Red"
    }
    else if (color === PS.COLOR_ORANGE) {
        return "Orange"
    }
    else if (color === PS.COLOR_YELLOW) {
        return "Yellow"
    }
    else if (color === PS.COLOR_GREEN) {
        return "Green"
    }
    else if (color === PS.COLOR_BLUE) {
        return "Blue"
    }
    else if (color === PS.COLOR_VIOLET) {
        return "Violet"
    }
    else {
        return "Other"
    }
}

function shuffle(array) { // Fisher-Yates Shuffle, by Mike Bostock from https://bost.ocks.org/mike/shuffle/
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}

function newBoard() {
    for (let i = 0; i < gridWidth * gridHeight; i++) {
        grid[i] = colors[i%colors.length]
    }
    grid = shuffle(grid)
}

function renderBoard() {
    for(let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
            let gridCell = gridHeight*j+i
            PS.color(i, j, grid[gridCell])
        }
    }
}



/*
PS.touch ( x, y, data, options )
Called when the left mouse button is clicked over bead(x, y), or when bead(x, y) is touched.
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.touch = function( x, y, data, options ) {
	// Uncomment the following code line
	// to inspect x/y parameters:

	// PS.debug( "PS.touch() @ " + x + ", " + y + "\n" );

	// Add code here for mouse clicks/touches
	// over a bead.
};

/*
PS.release ( x, y, data, options )
Called when the left mouse button is released, or when a touch is lifted, over bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.release = function( x, y, data, options ) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.release() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse button/touch is released over a bead.
};

/*
PS.enter ( x, y, button, data, options )
Called when the mouse cursor/touch enters bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/
let mouseCoords = [0, 0]
PS.enter = function( x, y, data, options ) {
    mouseCoords = [x, y]
    PS.statusText(mouseCoords)
};

/*
PS.exit ( x, y, data, options )
Called when the mouse cursor/touch exits bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exit = function( x, y, data, options ) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.exit() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse cursor/touch exits a bead.
};

/*
PS.exitGrid ( options )
Called when the mouse cursor/touch exits the grid perimeter.
This function doesn't have to do anything. Any value returned is ignored.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exitGrid = function( options ) {
	// Uncomment the following code line to verify operation:

	// PS.debug( "PS.exitGrid() called\n" );

	// Add code here for when the mouse cursor/touch moves off the grid.
};

/*
PS.keyDown ( key, shift, ctrl, options )
Called when a key on the keyboard is pressed.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

const LEFT_ARROW = 1005
const UP_ARROW = 1006
const RIGHT_ARROW = 1007
const DOWN_ARROW = 1008
const LEFT = false
const RIGHT = true
const UP = false
const DOWN = true

function swap(array, a, b) {
    let c = array[a]
    array[a] = array[b]
    array[b] = c
}

function shift_row(row, direction) {
    if (direction === LEFT) {
        let startingPosition = row*gridWidth+1+gridWidth
        let finalColor = grid[(row)*gridWidth]
        for (let i = gridWidth; i > 1; i--) {
           grid[startingPosition-i-1] = grid[startingPosition-i]
        }
        grid[startingPosition-2] = finalColor
    }


    else if (direction === RIGHT) {
        let startingPosition = row*gridWidth
        let hanging = grid[startingPosition+gridWidth-1]
        for (let i = 0; i < gridWidth; i++) {
            let newHanging = grid[startingPosition+i]
            grid[startingPosition+i] = hanging
            hanging = newHanging
        }
    }
}

function shift_column(column, direction) {
    if (direction === UP) {
        let startingPosition = gridWidth*(gridHeight-1)+column
        let finalColor = grid[column]
        for (let i = gridHeight; i > 0; i--) {
            grid[startingPosition-(i*gridWidth)] = grid[startingPosition-((i-1)*gridWidth)]
        }
        grid[startingPosition] = finalColor
    }

    else if (direction === DOWN) {
        let startingPosition = column
        let hanging = grid[gridWidth*(gridHeight-1)+column]
        for (let i = 0; i < gridHeight; i++) {
            let newHanging = grid[startingPosition+gridWidth*i]
            grid[startingPosition+gridWidth*i] = hanging
            hanging = newHanging
        }
    }
}

PS.keyDown = function( key, shift, ctrl, options ) {
	// Uncomment the following code line to inspect first three parameters:

	// PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	// Add code here for when a key is pressed.
    if (key === LEFT_ARROW) {
        shift_row(mouseCoords[1], LEFT)
    }
    else if (key === RIGHT_ARROW) {
        shift_row(mouseCoords[1], RIGHT)
    }
    else if (key === UP_ARROW) {
        shift_column(mouseCoords[0], UP)
    }
    else if (key === DOWN_ARROW) {
        shift_column(mouseCoords[0], DOWN)
    }
    renderBoard()

};

/*
PS.keyUp ( key, shift, ctrl, options )
Called when a key on the keyboard is released.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyUp = function( key, shift, ctrl, options ) {
	// Uncomment the following code line to inspect first three parameters:

	// PS.debug( "PS.keyUp(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	// Add code here for when a key is released.
};

/*
PS.input ( sensors, options )
Called when a supported input device event (other than those above) is detected.
This function doesn't have to do anything. Any value returned is ignored.
[sensors : Object] = A JavaScript object with properties indicating sensor status; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
NOTE: Currently, only mouse wheel events are reported, and only when the mouse cursor is positioned directly over the grid.
*/

PS.input = function( sensors, options ) {
	// Uncomment the following code lines to inspect first parameter:

//	 var device = sensors.wheel; // check for scroll wheel
//
//	 if ( device ) {
//	   PS.debug( "PS.input(): " + device + "\n" );
//	 }

	// Add code here for when an input event is detected.
};

