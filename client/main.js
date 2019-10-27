/*
---------------------
Variable Declarations
---------------------
*/

// A websocket connection.
const socket = new WebSocket('ws://localhost:9000/');

// Canvas HTML element.
const canvas = document.getElementById("canvas");
// Width of the canvas.
canvas.width = Math.floor((Math.min(window.innerWidth, window.innerHeight) - 100) / 100) * 100;
// Height of the canvas.
canvas.height = canvas.width;
// Drawing context on canvas.
const context = canvas.getContext("2d");

// Number of rows and columns in grid.
const tilesPerSide = 20;
// Total number of tiles in grid.
const tilesOnCanvas = tilesPerSide * tilesPerSide;
// The width and height of each Tile.
const tileSize = canvas.width / tilesPerSide;

// The number of frames loaded each second.
let fps = 15;
// A 2D array to store every Tile in the grid.
let tileMap = [];
// The Tile at which the food gets placed.
let foodTile;
// A boolean for whether or not teleportation accross grid is disallowed.
let fenceActivated = true;
// An array to store all (2 in this case) Snake instances.
let snakes = [];
// The id of this client's Snake.
let mySnakeID;
// The id of the opponent client's Snake.
let opponentSnakeID;
// The id of this client.
let myPlayerID;
// The id of the opponent client.
let opponentPlayerID;
// Whether or not (0/1) this client is ready.
let myReady = 0;
// Whether or not (0/1) the opponent client is ready.
let opponentReady = 0;
// Whether or not all players are ready to enter the play state.
let allPlayersReady = false;
// The score of this client.
let myScore = 0;
// The score of the opponent client.
let opponentScore = 0;
// The length of the countdown each round.
let countdownLength = 3;
// Whehther or not the game is currently playable.
let playable = false;
// A setInterval for polling joins.
let joinPolling;
// A setInterval for polling ready-ups.
let readyPolling;
// The initial length of both snakes each round.
let startingSnakeLength = 10;
// The id of this client's joined session.
let sessionID;


/*
--------------------
Server Communication
--------------------
*/

// Listener for when a websocket connection to the server
// is established.
socket.addEventListener('open', () => {
	console.log("Connection has been established.")
});

// Listener for when a message is received from the server.
socket.addEventListener('message', event => {
	// Handle the message appropriately.
	receive(event.data);
});


// A function to convert the required data to a JSON string
// and send it to the server.
function send(data)
{
	// Converting the data into a JSON string.
	const message = JSON.stringify(data);
	// Send it to the server.
	socket.send(message);
}


// A function to handle a received message from the server.
// The message is parsed and then dealt with differently
// depending on the string value of its action property.
function receive(message)
{
	// Parsing the JSON string message into a JSON object.
	const data = JSON.parse(message);

	// Treat the data differently depending on action value.
	switch (data.action)
	{
		// If the action is "host", then assign the included data
		// values to their intended variables and enter the host state.
		case "host":
		{
			myPlayerID = data.my_player_id;
			mySnakeID = data.my_snake_id;
			opponentSnakeID = data.opponent_snake_id;
			sessionID = data.session_id;

			// Enter the host state.
			hostState();

			break;
		}
		// If the action is "join", then assign the included data
		// values to their intended variables and enter the join state.
		case "join":
		{
			myPlayerID = data.my_player_id;
			opponentPlayerID = data.opponent_player_id;
			mySnakeID = data.my_snake_id;
			opponentSnakeID = data.opponent_snake_id;

			// Enter the join state.
			joinState();

			break;
		}
		// If the action is "fetch opponent", then assign the included 
		// opponent player id to its corresponding variable.
		case "fetch opponent":
		{
			opponentPlayerID = data.opponent_player_id;

			// Stop the join polling interval.
			clearInterval(joinPolling);

			// Enter the ready state.
			readyState();

			break;
		}
		// If the action is "fetch players", then enter the ready state
		// only if the data includes an opponent player id.
		case "fetch players":
		{
			if (data.players.includes(opponentPlayerID))
			{
				// Stop the join polling interval.
				clearInterval(joinPolling);

				// Enter the ready state.
				readyState();
			}

			break;
		}
		// If the action is "update opponent readiness", then assign the
		// included opponent readiness to its corresponding variable.
		case "update opponent readiness":
		{
			opponentReady = data.ready;

			break;
		}
		// If the action is "ready to play", then enter the play state.
		case "ready to play":
		{
			// Stop the ready polling interval.
			clearInterval(readyPolling);

			// Enter the play state
			playState();

			break;
		}
		// If the action is "place first food", then call the function
		// to place food.
		case "place first food":
		{
			placeFood();

			break;
		}
		// If the action is "fecth food tile", then assign the included
		// tile coordinates to the food tile and set the tile element to FOOD.
		case "fetch food tile":
		{
			foodTile = tileMap
				[data.food_tile.y / tileSize]
				[data.food_tile.x  / tileSize];

			foodTile.element = "FOOD";

			break;
		}
		// If the action is "update opponent snake", then the opponent
		// snake will need new SnakePart data.
		case "update opponent snake":
		{
			// Make sure the tile following the snake is set empty.
			snakes[opponentSnakeID].clearTailPath();

			// For every SnakePart index in the opponent snake,
			// assign the included SnakePart data to the SnakePart
			// at the index.
			for (let index = 0;
					 index < snakes[opponentSnakeID].length;
					 index++)
			{
				Object.assign(
					snakes[opponentSnakeID].body[index],
					{
						x: data.snake.body[index].x,
						y: data.snake.body[index].y,
						direction: data.snake.body[index].direction,
						crashed: data.snake.body[index].crashed
					}
				);
			}

			// The length of the opponent snake prior to update.
			const oldLength = snakes[opponentSnakeID].length;

			// If the included opponent snake is longer than the old length
			// then add a new SnakePart with the required data as the new
			// tail and increment the opponent length by 1.
			if (data.snake.body.length > oldLength)
			{
				snakes[opponentSnakeID].body.push(new SnakePart(
					data.snake.body[oldLength].x,
					data.snake.body[oldLength].y,
					data.snake.body[oldLength].direction,
					snakes[opponentSnakeID]
				));
				
				snakes[opponentSnakeID].length++;
			}
			
			// Call the function to update the graphics.
			updateGraphics();

			// After a short delay...
			setTimeout(() => {
				// ... update this client's snake.
				snakes[mySnakeID].update();

				// If this client's snake is movable, send
				// the new snake data to the server.
				if (snakes[mySnakeID].movable)
				{
					send({
						action: "send my snake",
						snake: snakes[mySnakeID],
						my_player_id: myPlayerID,
						opponent_player_id: opponentPlayerID,
					});
				}
				// Otherwise, crash this client's snake and send
				// the crash to the server.
				else
				{
					send({
						action: "crash my snake",
						snake: snakes[mySnakeID],
						my_player_id: myPlayerID,
						opponent_player_id: opponentPlayerID,
					});
				}
			}, 1000 / fps);

			break;
		}
		// If the action is "score opponent player",
		// then this client has won this round.
		case "score my player":
		{
			// Increment this client's score by 1.
			myScore++;

			// Make the game unplayable for the moment.
			playable = false;
			
			// 
			//snakes[opponentSnakeID].setMovable(false);

			// Remove the opponent snake's tail.
			snakes[opponentSnakeID].clearTailPath();

			// For every SnakePart index in the opponent snake,
			// assign the included SnakePart data to the SnakePart
			// at the index.
			for (let index = 0;
					 index < snakes[opponentSnakeID].length;
					 index++)
			{
				Object.assign(
					snakes[opponentSnakeID].body[index],
					{
						x: data.snake.body[index].x,
						y: data.snake.body[index].y,
						direction: data.snake.body[index].direction,
						crashed: data.snake.body[index].crashed
					}
				);
			}

			// The length of the opponent snake prior to update.
			const oldLength = snakes[opponentSnakeID].length;

			// If the included opponent snake is longer than the old length
			// then add a new SnakePart with the required data as the new
			// tail and increment the opponent length by 1.
			if (data.snake.body.length > oldLength)
			{
				snakes[opponentSnakeID].body.push(new SnakePart(
					data.snake.body[oldLength].x,
					data.snake.body[oldLength].y,
					data.snake.body[oldLength].direction,
					snakes[opponentSnakeID]
				));
				
				snakes[opponentSnakeID].length++;
			}

			// Draw the opponent snake.
			snakes[opponentSnakeID].draw();

			// Start the next round after 1 second.
			setTimeout(startNextRound, 1000);

			break;
		}
		// If the action is "score opponent player",
		// then the opponent has won this round.
		case "score opponent player":
		{
			// Increment the opponent's score by 1.
			opponentScore++;

			// Make the game unplayable for the moment.
			playable = false;

			// Update the graphics.
			updateGraphics();

			// Start the next round after 1 second.
			setTimeout(startNextRound, 1000);

			break;
		}
	}
}


/*
------------------
Game Functionality
------------------
*/

// A function to place a food item at a random Tile.
function placeFood()
{
	// Generate an empty Tile randomly.
	do
	{
		foodTile = tileMap
			[Math.floor(Math.random() * tilesPerSide)]
			[Math.floor(Math.random() * tilesPerSide)];
	}
	while (foodTile.element != "EMPTY");

	//Set the element of the generated Tile to 'FOOD'.
	foodTile.element = "FOOD";

	// Also, send the opponent player the chosen food tile.
	send({
		action: "send food tile",
		food_tile: foodTile,
		opponent_player_id: opponentPlayerID,
	});
}


// A function to initialise the tiles in the grid.
function initialiseTiles()
{
	// Make the tileMap array 2-dimensional and fill it with tiles
	// with the appropriate x- and y-coordinates.
	for (let yIndex = 0; yIndex < tilesPerSide; yIndex++)
	{
		tileMap[yIndex] = [];
		for (let xIndex = 0; xIndex < tilesPerSide; xIndex++)
		{
			tileMap[yIndex][xIndex] = new Tile(
				xIndex * tileSize,
				yIndex * tileSize
			);
		}
	}
}


// A function to draw all tiles onto the canvas.
function drawAllTiles()
{
	// For each row of tiles in the grid...
	tileMap.forEach((tileRow) => {
		// ...and for each Tile in the row, draw it on the
		// canvas. Food items are drawn orange, whereas
		// regular tiles are drawn green.
		tileRow.forEach((tile) => {
			if (tile.element == "FOOD")
			{
				context.fillStyle = "orange";
			}
			else
			{
				context.fillStyle = "green";
			}

			context.strokeStyle = "white";
			context.lineWidth = 0.2;
			context.fillRect(tile.x, tile.y, tileSize, tileSize);
			context.strokeRect(tile.x, tile.y, tileSize, tileSize);
		})
	});
}


// A function to return null in case of an exception.
function getPossibleNull(requiredFunction)
{
	// If the passed function executes normally, return it.
	try
	{
		return requiredFunction();
	}
	// If it causes an exception, then simply return null.
	catch(exception)
	{
		return null;
	}
}


// A function to update the graphics of the canvas.
function updateGraphics()
{
	// Draw all the tiles onto the canvas.
	drawAllTiles();

	// Call the function to draw the snakes on the canvas.
	snakes[mySnakeID].draw();
	snakes[opponentSnakeID].draw();

	// If fenceActivated is activated, draw it on the canvas.
	if (fenceActivated)
	{
		context.strokeStyle = "black";
		context.lineWidth = 5;
		context.strokeRect(0, 0, canvas.width, canvas.height);
	}
}


// A function to update the UI of a client that has hosted a session.
function hostState()
{
	// Hide all initially shown start buttons.
	document.getElementById("start-button-container").style.display = "none";

	// Display the joining code and that the client is waiting
	// for someone to join.
	document.getElementById("message").innerHTML
		= "Waiting for an opponent to join. SESSION ID: " + sessionID;

	// Initialise all tiles in the grid and draw them.
	initialiseTiles();
	drawAllTiles();

	// Create my new Snake instance and initialise it.
	snakes.push(new Snake(10, "RIGHT"));
	snakes[mySnakeID].initialise();
}


// A function to update the UI of a client that has joined a random session.
function joinState()
{
	// Hide all initially shown start buttons.
	document.getElementById("start-button-container").style.display = "none";

	// Display that the client is waiting for someone to join.
	document.getElementById("message").innerHTML
		= "Waiting for an opponent to join.";

	// Initialise all tiles in the grid and draw them.
	initialiseTiles();
	drawAllTiles();

    // Check if this client joined first.
	if (mySnakeID == 0)
	{
		// Create my new Snake instance and initialise it.
		snakes.push(new Snake(startingSnakeLength, "RIGHT"));
		snakes[mySnakeID].initialise();
	}
	else
	{
		// Create a new Snake instance for the opponent player.
		snakes.push(new Snake(startingSnakeLength, "RIGHT"));

		// Create my new Snake instance and initialise it.
		snakes.push(new Snake(startingSnakeLength, "LEFT"));
		snakes[mySnakeID].initialise();
	}

    // Poll for players to join.
	joinPolling = setInterval(() => {
		send({
			action: "request players",
			my_player_id: myPlayerID,
		});
	}, 200);
}


// A function to update the UI of a client that is in a full a session,
// waiting for both clients to click ready.
function readyState()
{
	// Hide the ready button.
	document.getElementById("ready").style.display = "initial";

	// If only my snake has been created, create one for
	// the opponent as well.
	if (snakes.length < 2)
	{
		snakes.push(new Snake(
			startingSnakeLength,
			"LEFT"
		));
	}

	// Initialise the opponent snake, since both players
	// have now joined.
	snakes[opponentSnakeID].initialise();

	// Poll for players to click ready, while updating the displayed
	// count of ready players.
	readyPolling = setInterval(() => {
		const noOfReady
			= (parseInt(myReady * 1) + parseInt(opponentReady * 1));

		document.getElementById("message").innerHTML
			= noOfReady + "/2 players ready.";
	}, 200);

	// Let server decide which client should generate
	// first food's location.
	send({
		action: "pick food placer",
		my_player_id: myPlayerID,
		opponent_player_id: opponentPlayerID,
	});
}


// A function to update the UI of a client that is ready to play the game.
function playState()
{
	// Since both clients are ready, make them unready for the next round.
	myReady = 0;
	opponentReady = 0;

	// Display the initial or newly changed scores.
	updateScore();

	// Remove the previous message being displayed.
	document.getElementById("message").innerHTML = "";
	// Hide the ready button.
	document.getElementById("ready").style.display = "none";

	// The number of seconds left on the countdown, initially the
	// default length of the countdown.
	let currentSecond = countdownLength;

	// A recursive function which initiates the game after the count
	// reaches 0.
	function countdown()
	{
		// Display the number of seconds left on the countdown.
		document.getElementById("countdown").innerHTML = currentSecond;

		// Decrement the number of seconds left on the countdown by 1.
		currentSecond--;

		// If the current second is 0 or greater, call this function again
		// after 1 second.
		if (currentSecond > -1)
		{
			setTimeout(countdown, 1000);
		}
		// Otherwise, the client is ready to start playing.
		else
		{
			// Display GO in place of the countdown number.
			document.getElementById("countdown").innerHTML = "GO!";

			// Remove the displayed GO message after 1 second.
			setTimeout(() => {
				document.getElementById("countdown").innerHTML = "";
			}, 1000);

			// After a short delay, send this client's snake data for
			// the first time to the server and set playable to true.
			setTimeout(() => {
				send({
					action: "send my snake",
					snake: snakes[mySnakeID],
					my_player_id: myPlayerID,
					opponent_player_id: opponentPlayerID,
				});

				playable = true;
			}, 1000 / fps);
		}
	}

	// Call the countdown function for the first time.
	countdown();
}


// A function to re-initialise all the tiles on the canvas
// and enter the play state once again after placing the
// snakes into their respective positions.
function startNextRound()
{
	initialiseTiles();

	// Draw all the tiles onto the canvas.
	drawAllTiles();

	// Let the server decide which client should generate
	// first food's location.
	send({
		action: "pick food placer",
		my_player_id: myPlayerID,
		opponent_player_id: opponentPlayerID,
	});

	// Remove all the snakes in the snakes array.
	snakes.length = 0;

	// Create all Snake instances again and initialise them.
	snakes.push(new Snake(startingSnakeLength, "RIGHT"));
	snakes.push(new Snake(startingSnakeLength, "LEFT"));
	snakes[mySnakeID].initialise();
	snakes[opponentSnakeID].initialise();

	// Set this client to be ready.
	myReady = 1;
	
	// Send this client's readiness to the server.
	send({
		action: "send my readiness",
		ready: myReady,
		my_player_id: myPlayerID,
		opponent_player_id: opponentPlayerID,
	});
}


// A function which updates the shown scores belonging to both players.
function updateScore()
{
	// Display this client's score.
	document.getElementById("my-score").innerHTML = "Your score: " + myScore;
	// Display the opponent client's score.
	document.getElementById("opponent-score").innerHTML = "Opponent's score: " + opponentScore;
}


// A click-event listener for the join private button, which upon click
// sends a request to the server to join the session with the supplied id.
document.getElementById("join-private").addEventListener("click", () => {
	send({
		action: "request join private",
		session_id: document.getElementById("session-input").value,
	});
});


// A click-event listener for the host private button, which upon click
// sends a request to the server to host a new session.
document.getElementById("host-private").addEventListener("click", () => {
	send({
		action: "request host private",
	});
});


// A click-event listener for the join random button, which upon click
// sends a request to the server to join a random session.
document.getElementById("join-random").addEventListener("click", () => {
	send({
		action: "request join random",
	});
});


// A click-event listener for the ready button, which upon click
// toggles the readiness of this client and sends it to the server.
document.getElementById("ready").addEventListener("click", () => {
	if (!myReady)
	{
		myReady = 1;
	}
	else
	{
		myReady = 0;
	}

	send({
		action: "send my readiness",
		ready: myReady,
		my_player_id: myPlayerID,
		opponent_player_id: opponentPlayerID,
	});
});


// A keydown-event listener.
document.addEventListener("keydown", (event) => {
	// Check if the game is currently playable.
	if (playable)
	{
		// Turn 'LEFT' with 'LEFT_ARROW' key.
		if (event.keyCode == "37" &&
				snakes[mySnakeID].body[0].direction != "RIGHT")
		{
			snakes[mySnakeID].queuedDirections.unshift("LEFT");
		}

		// Turn 'UP' with 'UP_ARROW' key.
		if (event.keyCode == "38" &&
				snakes[mySnakeID].body[0].direction != "DOWN")
		{
			snakes[mySnakeID].queuedDirections.unshift("UP");
		}

		// Turn 'RIGHT' with 'RIGHT_ARROW' key.
		if (event.keyCode == "39" &&
				snakes[mySnakeID].body[0].direction != "LEFT")
		{
			snakes[mySnakeID].queuedDirections.unshift("RIGHT");
		}

		// Turn 'DOWN' with 'DOWN_ARROW' key.
		if (event.keyCode == "40" &&
				snakes[mySnakeID].body[0].direction != "UP")
		{
			snakes[mySnakeID].queuedDirections.unshift("DOWN");
		}
	}
});

// A complementary keydown-event listener which prevents default
// behaviour of some keydown events.
document.addEventListener("keydown", function(event) {
	if([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
		event.preventDefault();
	}
}, false);