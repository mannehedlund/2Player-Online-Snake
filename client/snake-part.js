// A SnakePart is a part of the snake's body. It can 
// be found at a Tile's position and has an x- and
// y-coordinate, a direction and a crash state.
class SnakePart
{
	// A constructor for SnakePart.
	constructor(x, y, direction, snake)
	{
		// The x-coordinate.
		this.x = x;
		// The y-coordinate.
		this.y = y;
		// The direction of this SnakePart.
		this.direction = direction;
		// The element of the tile associated with this SnakePart.
		this.tile.element = "SNAKE";
		// The Snake associated with the tile associated
		// with this SnakePart.
		this.tile.snake = this.snake;
		// Whether or not SnakePart has crashed.
		this.crashed = false;
	}


	// Return the Tile at this SnakePart.
	get tile()
	{
		return tileMap[this.y / tileSize][this.x / tileSize];
	}


	// Set the crash state of this SnakePart as required.
	setCrashed(boolean)
	{
		this.crashed = boolean;
	}
}