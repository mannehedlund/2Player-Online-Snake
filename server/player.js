// A player is a representation of a client. It will have an
// associated websocket connection for when the server needs to
// communicate with it and will store client-specific information.
class Player
{
	// A constructor for Player.
	constructor(socket)
	{
		// A websocket connection between this Player and the server.
		this.socket = socket;
		// The snake belonging to this Player, initially null.
		this.snake = null;
		// The score achieved by this Player so far.
		this.score = 0;
		// Whether or not this Player is ready to play.
		this.awaitingReady = false;
		// Whether or not this Player is the one to place the
		// first food during the round.
		this.placesFirstFood = false;
	}


	// Set the readiness of this Player as required.
	awaitReady(boolean)
	{
		this.awaitingReady = boolean;
	}


	// Set whether or not this Player is the one that
	// should place the first food during the round.
	placeFirstFood(boolean)
	{
		this.placesFirstFood = boolean;
	}


	// Set the snake of this Player as required.
	setSnake(snake)
	{
		this.snake = snake;
	}


	// Convert the required data to a JSON string
	// and send it to the server.
	send(data)
	{
		const message = JSON.stringify(data);
		this.socket.send(message);
	}
}

// Make this class importable to the server code as a node module.
module.exports = Player;