// A Tile is a constituent of the grid. It has an x- and y-coordinate
// and an element, either 'EMPTY', 'SNAKE' or 'FOOD'.
class Tile
{
	// A constructor for Tile.
	constructor(x, y)
	{
		// The x-coordinate.
		this.x = x;
		// The y-coordinate.
		this.y = y;
		// The element contained in this tile.
		this.element = "EMPTY";
		// The Snake at this Tile for when element = 'SNAKE'.
		this.snake = null;
	}


	// Return the Tile to the top of this Tile.
	get top()
	{
		return tileMap[this.y / tileSize - 1][this.x / tileSize];
	}


	// Return the Tile to the right of this Tile.
	get right()
	{
		return tileMap[this.y / tileSize][this.x / tileSize + 1];
	}


	// Return the Tile to the bottom of this Tile.
	get bottom()
	{
		return tileMap[this.y / tileSize + 1][this.x / tileSize];
	}


	// Return the Tile to the left of this Tile.
	get left()
	{
		return tileMap[this.y / tileSize][this.x / tileSize - 1];
	}


	// Return the SnakePart at this Tile.
	getSnakePart(snake)
	{
		// Variables to be used in inner function.
		const tileX = this.x;
		const tileY = this.y;
		let bodyPartToReturn;

		// For every snake body part, check if its coordinates
		// matches that of this Tile. If so, then it should
		// be returned.
		snake.body.forEach((bodyPart) => {
			if (bodyPart.x == tileX && bodyPart.y == tileY)
			{
				bodyPartToReturn = bodyPart;
			}
		});

		// Now return the body part matching the tile's coordinates.
		return bodyPartToReturn;
	}


	// Set the element of this Tile to 'EMPTY'. Also, make sure it
	// does not have an associated snake.
	setEmpty()
	{
		this.element = "EMPTY";
		this.snake = null;
	}


	// Set the element of this Tile to 'SNAKE'. Also set the
	// associated snake to be the given parameter.
	setSnake(snake)
	{
		this.element = "SNAKE";
		this.snake = snake;
	}
}