// A Snake is what you control and play the game as.
class Snake
{
	// A constructor for Snake.
	constructor(length, initDirection)
	{
		// A SnakePart array containing the body of this Snake.
		this.body = [];
		// The number of SnakeParts that make up this Snake.
		this.length = length;
		// The initial direction of the head of this Snake.
		this.initDirection = initDirection;
		// An array to store the selected directions
		// for the head of this Snake.
		this.queuedDirections = [];
		// A boolean to allow the Snake to move.
		this.movable = true;
		// A boolean to indicate whether or not this Snake
		//  needs to teleport accross the grid.
		this.needsTeleport = false;
	}


	// A function to initialise the Snake.
	initialise()
	{
	 // Add all of the SnakeParts to the body array differently
	 // depending on the initial direction given.
		switch(this.initDirection)
		{
			case "UP":
			{
				// Add the head of the Snake onto the body array,
				// making sure the x-coordinate is calculated to allow
				// the rest of the Snake to fit in the grid, so that the
				// Snake is placed in the downright corner facing up.
				this.body.push(new SnakePart(
					tileSize * tilesPerSide - tileSize,
					tileSize * tilesPerSide - tileSize * this.length,
					this.initDirection,
					this
				));

				// If Snake head is going 'UP', then make the other
				// SnakePart's do the same.
				for (let index = 1; index < this.length; index++)
				{
					this.body.push(new SnakePart(
						this.body[index - 1].x,
						this.body[index - 1].y + tileSize,
						this.initDirection,
						this
					));
				}

				break;
			}
			case "RIGHT":
			{
				// Add the head of the Snake onto the body array,
				// making sure the x-coordinate is calculated to allow
				// the rest of the Snake to fit in the grid, so that the
				// Snake is placed in the required topleft facing right.
				this.body.push(new SnakePart(
					tileSize * (this.length - 1),
					0,
					this.initDirection,
					this
				));

				// If Snake head is going 'RIGHT', then make the other
				// SnakePart's do the same.
				for (let index = 1; index < this.length; index++)
				{
					this.body.push(new SnakePart(
						this.body[index - 1].x - tileSize,
						this.body[index - 1].y,
						this.initDirection,
						this
					));
				}

				break;
			}
			case "DOWN":
			{
				// Add the head of the Snake onto the body array,
				// making sure the x-coordinate is calculated to allow
				// the rest of the Snake to fit in the grid, so that the
				// Snake is placed in the topleft corner facing down.
				this.body.push(new SnakePart(
					0,
					tileSize * (this.length - 1),
					this.initDirection,
					this
				));

				// If Snake head is going 'DOWN', then make the other
				// SnakePart's do the same.
				for (let index = 1; index < this.length; index++)
				{
					this.body.push(new SnakePart(
						this.body[index - 1].x,
						this.body[index - 1].y - tileSize,
						this.initDirection,
						this
					));
				}

				break;

			}
			case "LEFT":
			{
				// Add the head of the Snake onto the body array,
				// making sure the x-coordinate is calculated to allow
				// the rest of the Snake to fit in the grid, so that the
				// Snake is placed in the bottomright corner facing left.
				this.body.push(new SnakePart(
					tileSize * tilesPerSide - tileSize * this.length,
					tileSize * tilesPerSide - tileSize,
					this.initDirection,
					this
				));

				// If Snake head is going 'LEFT', then make the other
				// SnakePart's do the same.
				for (let index = 1; index < this.length; index++)
				{
					this.body.push(new SnakePart(
						this.body[index - 1].x + tileSize,
						this.body[index - 1].y,
						this.initDirection,
						this
					));
				}

				break;
			}
		}

		// Draw the Snake at the starting position.
		this.draw();

		// Add the initial direction to the array of queued directions.
		this.queuedDirections.unshift(this.initDirection);
	}


	// A function to deal with any crash the Snake may face.
	checkForCrash()
	{
		switch(this.body[0].direction)
		{
			case "UP":
			{
				// Check if the Tile to the top of the
				// snake head doesn't exist.
				if (getPossibleNull(() => this.body[0].tile.top) == null)
				{
					// If so, then immobalise the snake if fence is activated.
					if (fenceActivated)
					{
						console.log("wall crash!");
						this.setMovable(false);
					}
					// Otherwise, teleport the snake to the
					// other side of the grid.
					else
					{
						// Set needsTeleport to true
						this.needsTeleport = true;

						// Check if the tile it needs to teleport to
						// is already occupied by a snake.
						if (tileMap[tilesPerSide - 1]
								[this.body[0].x / tileSize]
								.element == "SNAKE")
						{
							// If so, then immobalise the Snake.
							console.log("snake crash!");
							this.setMovable(false);

							// If the snake is crashing into itself, set
							// its crash-subjected snake part to crashed.
							if (tileMap[tilesPerSide - 1]
									[this.body[0].x / tileSize]
									.snake == this)
							{
								tileMap[tilesPerSide - 1]
									[this.body[0].x / tileSize]
									.getSnakePart(this).setCrashed(true);
							}
						}
						// Otherwise, make it able to move.
						else
						{
							this.setMovable(true);
						}
					}
				}
				// If the Tile to the top of the snake head does exist,
				// check if it instead contains a SnakePart.
				else if (this.body[0].tile.top.element == "SNAKE")
				{
					// If so, immobalise the snake.
					console.log("snake crash!");
					this.setMovable(false);

					// If SnakePart crashing into is this Snake's, set 
					// the crashing SnakePart to crashed.
					if (this.body[0].tile.top.snake == this)
					{
						this.body[0].tile.top
							.getSnakePart(this).setCrashed(true);
					}
				}
				// Otherwise, make it able to move.
				else
				{
					this.setMovable(true);
				}

				break;				
			}
			case "RIGHT":
			{
				// Check if the Tile to the right of the
				// snake head doesn't exist.
				if (getPossibleNull(() => this.body[0].tile.right) == null) 
				{
					// If so, then immobalise the snake if fence is activated.
					if (fenceActivated)
					{
						console.log("wall crash!");
						this.setMovable(false);
					}
					// Otherwise, teleport the snake to the
					// other side of the grid.
					else
					{
						// Set needsTeleport to true
						this.needsTeleport = true;

						// Check if the tile it needs to teleport to
						// is already occupied by a snake.
						if (tileMap[this.body[0].y / tileSize][0]
								.element == "SNAKE")
						{
							// If so, then immobalise the Snake.
							console.log("snake crash!");
							this.setMovable(false);

							// If the snake is crashing into itself, set
							// its crash-subjected snake part to crashed.
							if (tileMap[this.body[0].y / tileSize][0]
									.snake == this)
							{
								tileMap[this.body[0].y / tileSize][0]
									.getSnakePart(this).setCrashed(true);
							}
						}
						// Otherwise, make it able to move.
						else
						{
							this.setMovable(true);
						}
					}
				}
				// If the Tile to the right of the snake head does exist,
				// check if it instead contains a SnakePart.
				else if (this.body[0].tile.right.element == "SNAKE")
				{
					// If so, immobalise the snake.
					console.log("snake crash!");
					this.setMovable(false);

					// If SnakePart crashing into is this Snake's, set 
					// the crashing SnakePart to crashed.
					if (this.body[0].tile.right.snake == this)
					{
						this.body[0].tile.right
							.getSnakePart(this).setCrashed(true);
					}
				}
				// Otherwise, make it able to move.
				else {
					this.setMovable(true);
				} // end-else

				break;
			}
			case "DOWN":
			{
				// Check if the Tile to the bottom of the
				// snake head doesn't exist.
				if (getPossibleNull(() => this.body[0].tile.bottom) == null)
				{
					// If so, then immobalise the snake if fence is activated.
					if (fenceActivated)
					{
						console.log("wall crash!");
						this.setMovable(false);
					}
					// Otherwise, teleport the snake to the
					// other side of the grid.
					else
					{
						// Set needsTeleport to true
						this.needsTeleport = true;

						// Check if the tile it needs to teleport to
						// is already occupied by a snake.
						if (tileMap[0][this.body[0].x / tileSize]
								.element == "SNAKE")
						{
							// If so, then immobalise the Snake.
							console.log("snake crash!");
							this.setMovable(false);

							// If the snake is crashing into itself, set
							// its crash-subjected snake part to crashed.
							if (tileMap[0][this.body[0].x / tileSize]
									.snake == this)
							{
								tileMap[0][this.body[0].x / tileSize]
									.getSnakePart(this).setCrashed(true);
							}
						}
						// Otherwise, make it able to move.
						else
						{
							this.setMovable(true);
						}
					}
				}
				// If the Tile to the bottom of the snake head does exist,
				// check if it instead contains a SnakePart.
				else if (this.body[0].tile.bottom.element == "SNAKE")
				{
					// If so, immobalise the Snake.
					console.log("snake crash!");
					this.setMovable(false);

					// If SnakePart crashing into is this Snake's, set 
					// the crashing SnakePart to crashed.
					if (this.body[0].tile.bottom.snake == this)
					{
						this.body[0].tile.bottom
							.getSnakePart(this).setCrashed(true);
					}
				}
				// Otherwise, make it able to move.
				else
				{
					this.setMovable(true);
				}

				break;
			}
			case "LEFT":
			{
				// Check if the Tile to the left of the
				// snake head doesn't exist.
				if (getPossibleNull(() => this.body[0].tile.left) == null)
				{
					// If so, then immobalise the snake if fence is activated.
					if (fenceActivated)
					{
						console.log("wall crash!");
						this.setMovable(false);
					}
					// Otherwise, teleport the snake to the
					// other side of the grid.
					else
					{
						// Set needsTeleport to true
						this.needsTeleport = true;

						// Check if the tile it needs to teleport to
						// is already occupied by a snake.
						if (tileMap[this.body[0].y / tileSize]
								[tilesPerSide - 1]
								.element == "SNAKE")
						{
							// If so, then immobalise the Snake.
							console.log("snake crash!");
							this.setMovable(false);

							// If the snake is crashing into itself, set
							// its crash-subjected snake part to crashed.
							if (tileMap[this.body[0].y / tileSize]
									[tilesPerSide - 1]
									.snake == this)
							{
								tileMap[this.body[0].y / tileSize]
									[tilesPerSide - 1]
									.getSnakePart(this).setCrashed(true);
							}
						}
						// Otherwise, make it able to move.
						else
						{
							this.setMovable(true);
						}
					}
				}
				// If the Tile to the left of the snake head does exist,
				// check if it instead contains a SnakePart.
				else if (this.body[0].tile.left.element == "SNAKE")
				{
					// If so, immobalise the Snake.
					console.log("snake crash!");
					this.setMovable(false);

					// If SnakePart crashing into is this Snake's, set 
					// the crashing SnakePart to crashed.
					if (this.body[0].tile.left.snake == this)
					{
						this.body[0].tile.left
							.getSnakePart(this).setCrashed(true);
					}
				}
				// Otherwise, make it able to move.
				else
				{
					this.setMovable(true);
				}

				break;
			}
		}

		// If immobalised, set snake head to crashed.
		// (crashing SnakePart is already set to crashed)
		if (!this.movable)
		{
			this.body[0].setCrashed(true);
		}
		// If not, then unset all SnakePart's.
		else
		{
			this.body.forEach((bodyPart) => {
				bodyPart.setCrashed(false);
			});
		}
	}


	// A function that makes sure that the Tile at end of
	// the snake no longer contains a snake.
	clearTailPath()
	{
		this.body[this.length - 1].tile.setEmpty();
	}


	// A function which sets the snake's movable property as required.
	setMovable(boolean)
	{
		this.movable = boolean;
	}


	// A function to move the snake one Tile in its direction.
	move()
	{
		// For every SnakePart in the body array make the SnakePart take on
		// the direction and x- and y-coordinates of the SnakePart ahead
		// of it.
		for (let index = this.length - 1; index > 0; index--)
		{
			this.body[index].x = this.body[index - 1].x;
			this.body[index].y = this.body[index - 1].y;
			this.body[index].direction = this.body[index - 1].direction;
		}

		// In case the snake needs to teleport to other side of the grid...
		if (this.needsTeleport)
		{
			// ...assign the head of the snake new coordinates accordingly
			// based on its direction.
			switch(this.body[0].direction)
			{
				case "UP":
				{
					this.body[0].y = canvas.height - tileSize;
					break;
				}
				case "RIGHT":
				{
					this.body[0].x = 0;
					break;
				}
				case "DOWN":
				{
					this.body[0].y = 0;
					break;
				}
				case "LEFT":
				{
					this.body[0].x = canvas.width - tileSize;
					break;
				}
			}

			// After its been assigned new coordinates, 
			// it no longer needs be teleported.
			this.needsTeleport = false;
		}
		// If not, then move snake head 1 tileSize in its direction.
		else
		{
			switch(this.body[0].direction)
			{
				case "UP":
				{
					this.body[0].y -= tileSize;
					break;
				}
				case "RIGHT":
				{
					this.body[0].x += tileSize;
					break;
				}
				case "DOWN":
				{
					this.body[0].y += tileSize;
					break;
				}
				case "LEFT":
				{
					this.body[0].x -= tileSize;
					break;
				}
			}
		}

		// If the Tile at the snake head's new position 
		// contains a food item then eat it.
		if (this.body[0].tile.element == "FOOD")
		{
			this.eatFood();
		}
	}


	// A function to eat a food item and grow 1 in length.
	eatFood()
	{
		// Add a SnakePart to the body array, differently
		// depending on the direction of the last SnakePart.
		switch(this.body[this.length - 1].direction)
		{
			case "UP":
			{
				// If last SnakePart is going 'UP', then make the new
				// SnakePart do the same.
				this.body.push(new SnakePart(
					this.body[this.length - 1].x,
					this.body[this.length - 1].y + tileSize,
					this.body[this.length - 1].direction,
					this
				));

				break;
			}
			case "RIGHT":
			{
				// If last SnakePart is going 'RIGHT', then make 
				// the new SnakePart do the same.
				this.body.push(new SnakePart(
					this.body[this.length - 1].x - tileSize,
					this.body[this.length - 1].y,
					this.body[this.length - 1].direction,
					this
				));

				break;				
			}
			case "DOWN":
			{
				// If last SnakePart is going 'DOWN', then make 
				// the new SnakePart do the same.
				this.body.push(new SnakePart(
					this.body[this.length - 1].x,
					this.body[this.length - 1].y - tileSize,
					this.body[this.length - 1].direction,
					this
				));
				
				break;
			}
			case "LEFT":
			{
				// If last SnakePart is going 'LEFT', then make 
				// the new SnakePart do the same.
				this.body.push(new SnakePart(
					this.body[this.length - 1].x + tileSize,
					this.body[this.length - 1].y,
					this.body[this.length - 1].direction,
					this
				));
				
				break;
			}
		}

		// Since a SnakePart has been added to the body array the length,
		// property of the snake must be manually incremented by 1.
		this.length++;

		// Since the food item is now gone, place a new one.
		placeFood();
	}


	// A function to draw the snake on the canvas.
	draw()
	{
		// Set the Tile of the start of the snake to now contain snake.
		this.body[0].tile.setSnake(this);

		// In reverse order (order not noticeable), draw each
		// SnakePart of the body array onto the canvas.
		// SnakeParts are drawn red if crashed and blue otherwise.
		this.body.slice().reverse().forEach((bodyPart) => {
			if (bodyPart.crashed)
			{
				context.fillStyle = "red";
			}
			else
			{
				context.fillStyle = "blue";
			}

			context.strokeStyle = "black";
			context.fillRect(bodyPart.x, bodyPart.y, tileSize, tileSize);
			context.strokeRect(bodyPart.x, bodyPart.y, tileSize, tileSize);
		});
	}


	// A function which checks if snake crashes, moves it, and draws it
	// on the canvas.
	update()
	{
		// Save the snake head's direction when crashing in 
		// a temporary variable. This will be its direction
		// as long as it remains crashed.
		const crashingDirection = this.body[0].direction;

		// Take the direction from the beginning of the array of queued
		// directions and make it the snake head's direction.
		this.body[0].direction = this.queuedDirections[0];

		// Check for a crash before moving.
		this.checkForCrash();

		// Move the snake if movable, after clearing its tail path.
		if (this.movable)
		{
			this.clearTailPath();
			this.move();
		}
		// Otherwise, any change to the snake head's direction
		// still resulted in crash, so we revert it back to its
		// crashing direction.
		else
		{
			this.body[0].direction = crashingDirection;
		}

		/*
		// Draw the snake on the canvas.
		this.draw();
		*/
	}
}