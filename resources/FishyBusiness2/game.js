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
const gridWidth = 32;
const gridHeight = 32;
let gravity = 0.00001// pix/update
const BACKGROUND_COLOR = 0x25ba9f
const PLAYER_COLOR = PS.COLOR_GREEN
const TARGET_FPS = 30
let PIPE_SPEED = 0.002
class rectangle {
	constructor(height, width, color, startingX, startingY, velocityX = 0, velocityY = 0) {
		this.height = height;
		this.width = width;

		this.sprite = PS.spriteSolid(this.width, this.height)
		PS.spriteSolidColor(this.sprite, color)
		PS.spritePlane(this.sprite, 1)
		PS.spriteAxis(this.sprite, 0, 0)

		this.rawX = startingX;
		this.x = Math.round(this.rawX);
		this.rawY = startingY;
		this.y = Math.round(this.rawY);
		this.color = color;
		this.velocityX = velocityX;
		this.velocityY = velocityY;
	}

	blit() {
		PS.spriteSolidColor(this.sprite, this.color)
		PS.spriteMove(this.sprite, this.x, this.y)
	}

	moveToPosition() {
		this.x = Math.round(this.rawX);
		this.y = Math.round(this.rawY);
		this.blit();
	}

	processVelocity(deltaTime) {
		this.rawX += (this.velocityX*deltaTime);
		this.rawY += Math.min((this.velocityY*deltaTime), gridHeight-Math.ceil(this.height/2));
		this.moveToPosition();
	}
}

const bottom = "top";

class Pipe extends rectangle {
	constructor(height, width, color, startingX, mode) {
		let startingY = gridHeight/2
		if (mode === bottom) {
			startingY = 0
		}
		else {
			startingY = 32-height
		}
		super(height, width, color, startingX, startingY)
		this.mode = mode;
		this.scored = false;
		PS.spriteCollide(this.sprite, this.touching)
		PS.spritePlane(this.sprite, 2)
	}

	changeHeight(newHeight) {
		this.height = newHeight
	}

	advance(speed, deltaTime, nextPair) {
		this.rawX -= speed*deltaTime
		this.moveToPosition()
		if (this.rawX < 0-this.width) {
			this.regenerate(nextPair)
			if (this.mode === bottom) {
				return true;
			}
		}
		return false;
	}
	regenerate(nextPair) {
		this.rawX = gridWidth
		let nextHeight = 0
		if (this.mode === bottom) {
			nextHeight = nextPair[0]
		}
		else {
			nextHeight = nextPair[1]
		}
		this.changeHeight(nextHeight)
		this.scored = false;
	}

	checkScoring() {
		if (this.mode === bottom && !this.scored && this.rawX < player.rawX) {
			this.scored = true;
			PIPE_SPEED *= 1.025
			return true;
		}
		return false;
	}

	touching(s1, p1, s2, p2, type) {
		if (s2 === player.sprite && !(s1 === player.sprite)) {
			gameOver = true;
		}
	}
}

class PhysicsRectangle extends rectangle{
	constructor(height, width, color, startingX, startingY) {
		super(height, width, color, startingX, startingY);
		this.moveSpeed = 0.002;
	}

	doGravity(deltaTime) {
		if (!jumpPressed) {
			this.velocityY += gravity * deltaTime;
		}
	}

}

class Player extends PhysicsRectangle {
	constructor(height, width, color, startingX, startingY, jumpForce) {
		super(height, width, color, startingX, startingY)
		this.jumpForce = jumpForce;
		PS.spritePlane(this.sprite, 3)
	}

	jump() {
		this.velocityY = -0.007
	}
	touchingGround() {
		return (this.rawY > gridHeight)
	}

	blit() {
		PS.glyph(PS.ALL, PS.ALL, "")


		PS.spriteSolidColor(this.sprite, this.color)
		PS.spriteMove(this.sprite, this.x, this.y)

		PS.glyph(this.x, this.y, "⦦")
		PS.glyph(this.x+1, this.y, "┐")
		PS.glyph(this.x, this.y+1, "⦧")
		PS.glyph(this.x+1,this.y+1, "┘")
	}
}

class Shark extends rectangle {
	constructor(height, width, color, startingX, startingY, playerToFollow) {
		super(height, width, color, startingX, startingY)
		this.player = playerToFollow
		this.positionBuffer = []
		for (let i = 0; i < 100; i++) {
			this.positionBuffer.push(-10)
		}
		this.targetPosition = this.player.y
		PS.spritePlane(this.sprite, 3)
	}

	moveToTarget() {
		this.positionBuffer.shift()
		this.positionBuffer.push(this.player.y)
		this.y = this.positionBuffer[0]
		this.blit()
	}

	blit() {
		PS.spriteSolidColor(this.sprite, this.color)
		PS.spriteMove(this.sprite, this.x, this.y)
		if (this.y >= 1 && this.y <= gridHeight) {

			PS.glyph(this.x+1, this.y-1, "⦣")
			PS.color(this.x+1, this.y-1, PS.COLOR_GREY)
		}
	}
}


let gameStarted = false;
let gameOver = false;
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

	PS.gridSize( gridWidth, gridHeight);

	// This is also a good place to display
	// your game title or a welcome message
	// in the status line above the grid.
	// Uncomment the following code line and
	// change the string parameter as needed.

	// PS.statusText( "Game" );

	// Add any other initialization code you need here.
	gameStarted = false;
	gameOver = false;
	PS.seed(1)
	PS.border(PS.ALL, PS.ALL, 0)
	PS.statusText("Press Space To Begin")
	PS.audioLoad("FishyBusiness", options={autoplay:true, loop:true, path:"./", fileTypes:["mp3"]})

};

function generateNewPair() {
	let gapPosition = PS.random(gridHeight-8-8)+8//random from 8 to gridHeight-8
	return [gapPosition-5, 32-gapPosition-5]
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
let deltaTime = -1;
let iter = 0

const background = new rectangle(gridHeight, gridWidth, BACKGROUND_COLOR, 0, 0)
const player = new Player(2, 2, PLAYER_COLOR, 8, 14, 0.03);
const shark = new Shark(3, 3, PS.COLOR_GRAY, 0, player.y, player)
let pairs = [generateNewPair(), generateNewPair(), generateNewPair()]
const pipeColor = 0xFF7F50
let pipes = [
	new Pipe(pairs[0][0], 3, pipeColor, 18, "bottom"),
	new Pipe(pairs[0][1], 3, pipeColor, 18, bottom),
	new Pipe(pairs[1][0], 3, pipeColor, Math.round(18+gridWidth/3), "bottom"),
	new Pipe(pairs[1][1], 3, pipeColor, Math.round(18+gridWidth/3), bottom),
	new Pipe(pairs[2][0], 3, pipeColor, Math.round(18+(gridWidth/3)*2), "bottom"),
	new Pipe(pairs[2][1], 3, pipeColor, Math.round(18+(gridWidth/3)*2), bottom)
]
let score = 0;
let time = 0
let update = function() {
	if (deltaTime === -1) {
		deltaTime = Date.now();
	}
	const elapsed = Date.now() - deltaTime;
	//////////
	if (elapsed >= Math.floor(1000/TARGET_FPS)) {
		background.blit()
		for (let i = 0; i < pipes.length; i++) {
			if (pipes[i].advance(PIPE_SPEED, elapsed, pairs[2])) {
				pairs.push(generateNewPair())
				pairs.shift();
			}
			if (pipes[i].checkScoring()) {
				score++;
				PS.audioPlay("fx_bloop")
			}
			if (gameOver) {
				return;
			}
		}
		if (player.touchingGround()) {
			return
		}
		player.doGravity(elapsed);
		PS.statusText(score)
		player.processVelocity(elapsed)
		shark.moveToTarget()

		////////
		deltaTime = Date.now()
		PS.gridRefresh();
	}
	requestAnimationFrame(update)
}
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

	//PS.statusText( "PS.enter() @ " + x + ", " + y + "\n" );

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
let jumpPressed = false;
PS.keyDown = function( key, shift, ctrl, options ) {
	// Uncomment the following code line to inspect first three parameters:

	//PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );
	if (!gameStarted) {
		gameStarted = true;
		requestAnimationFrame(update);
	}
	if (key === 32) {
		jumpPressed = true;
		player.jump();
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
	if (key === 32) {
		jumpPressed = false;
		player.velocityY = 0
	}
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

