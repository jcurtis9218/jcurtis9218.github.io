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


let gm;
const initialSequenceLength = 3

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

    PS.gridSize( gridSize, gridSize );

    // This is also a good place to display
    // your game title or a welcome message
    // in the status line above the grid.
    // Uncomment the following code line and
    // change the string parameter as needed.

    // PS.statusText( "Game" );

    // Add any other initialization code you need here.

    gm = new GameManager(initialSequenceLength)

};

const L = "←"
const R = "→"
const U = "↑"
const D = "↓"
const REV = "↩"
const OPP = "⭿"

const gridSize = 8
function resetGame(previousLength) {
    if (previousLength < Math.pow(gridSize, 2)-1) {
        gm = new GameManager(previousLength + 1)
    }
}

let nextNote = 0
function playNextNote() {
    PS.audioPlay(PS.piano(60+nextNote++%13))
}

class GameManager {
    constructor(sequenceLength) {
        PS.color(PS.ALL, PS.ALL, PS.COLOR_GREEN)
        nextNote = 0
        this.level = 0
        this.oppositeMode = false
        this.idCounter = 0
        this.sequence = []
        this.gameRunning = true
        this.readyCell = 0
        this.generateSequence(sequenceLength)
    }

    report() {
        PS.debug("Level: "+this.level+"\n")
        PS.debug("Opposite Mode: " + this.oppositeMode+"\n")
        PS.debug("ID Counter: "+this.idCounter+"\n")
        PS.debug("Sequence: "+this.sequence+"\n")
        PS.debug("Game Running: "+this.gameRunning+"\n")
        PS.debug("Ready Cell: "+this.readyCell+"\n")
    }

    generateSequence(length) {
        this.sequence = []
        this.idCounter = 0
        for (let i = 0; i < length; i++) {
            let next = [L, R, U, D][PS.random(4) - 1]
            if (PS.random(5) === 5 && length >= 6) {
                this.sequence.push(new OppositeCell(this.idCounter % 8, Math.floor(this.idCounter / 8), OPP, this))
            } else {
                this.sequence.push(new InputCell(this.idCounter % 8, Math.floor(this.idCounter / 8), false, next, this))
            }
        }
        this.readyNext(-1)
    }

    readyNext(id) {
        if (id < this.sequence.length-1) {
            id++;
            this.readyCell = id;
            this.sequence[id].ready()
        }
        else {
            this.win()
        }
    }

    win() {
        this.gameRunning = false
        PS.audioPlay("fx_tada")
        resetGame(this.sequence.length)
    }

    assignId() {
        return this.idCounter++
    }
}

class Cell {
    constructor(x, y, color, glyph, gameManager) {
        this.x = x
        this.y = y
        this.color = color
        this.glyph = glyph
        this.gameManager = gameManager
        this.id = this.gameManager.assignId()
    }

    toString() {
        return "Cell at "+this.x+", "+this.y+" with id "+this.id
    }

    blit() {
        PS.color(this.x, this.y, this.color)
        PS.glyph(this.x, this.y, this.glyph)
    }

}

class InputCell extends Cell {
    constructor(x, y, complete, glyph, gameManager) {
        let color = PS.COLOR_RED
        if (complete === true) {
            color = PS.COLOR_GREEN
        }
        super(x, y, color, glyph, gameManager)
        this.isComplete = complete
        this.isNext = false
        this.desiredKey = -1
        if (this.glyph === L) {
            this.desiredKey = 1005
        }
        else if (this.glyph === U) {
            this.desiredKey = 1006
        }
        else if (this.glyph === R) {
            this.desiredKey = 1007
        }
        else if (this.glyph === D) {
            this.desiredKey = 1008
        }
        this.blit()
    }

    ready() {
        this.isNext = true
        PS.borderColor(this.x, this.y, PS.COLOR_GREEN)
    }

    complete() {
        playNextNote()
        this.isComplete = true
        this.color = PS.COLOR_GREEN
        PS.borderColor(this.x, this.y, PS.COLOR_GRAY)
        this.gameManager.readyNext(this.id)
    }

    checkInput(key) {
        PS.debug("Checking input "+key+" for cell at "+this.x+", "+this.y+". Desired key is "+this.desiredKey+"\n")
        if (!this.gameManager.oppositeMode === true) {
            if (key === this.desiredKey) {
                this.complete()
            }
        }
        else if (key !== this.desiredKey) {
            this.complete()
        }
    }
}

class OppositeCell extends Cell {
    constructor(x, y, glyph, gameManager) {
        super(x, y, PS.COLOR_BLUE, glyph, gameManager)
        this.blit()
    }

    ready() {
        PS.debug("Readying Opposite Cell with ID " +this.id)

        if (!this.gameManager.oppositeMode) {
            PS.color(PS.ALL, PS.ALL, PS.COLOR_RED)
            this.gameManager.oppositeMode = true;
            PS.audioPlay("fx_powerup6")
            this.gameManager.readyNext(this.id)
        }
        else {
            PS.color(PS.ALL, PS.ALL, PS.COLOR_GREEN)
            this.gameManager.oppositeMode = false
            PS.audioPlay("fx_powerup6")
            this.gameManager.readyNext(this.id)
        }
        PS.debug("Opposite Mode: "+this.gameManager.oppositeMode)
    }

    checkInput(key) {
        PS.debug("Tried to check input on Opposite Cell with ID "+this.id+". This shouldn't happen.\n")
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

PS.enter = function( x, y, data, options ) {
    // Uncomment the following code line to inspect x/y parameters:

    // PS.debug( "PS.enter() @ " + x + ", " + y + "\n" );

    // Add code here for when the mouse cursor/touch enters a bead.
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

PS.keyDown = function( key, shift, ctrl, options ) {
    // Uncomment the following code line to inspect first three parameters:

    //PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );
    gm.sequence[gm.readyCell].checkInput(key)
    for (const sequenceElement of gm.sequence) {
        sequenceElement.blit()
    }

    // Add code here for when a key is pressed.
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

