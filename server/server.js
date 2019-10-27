// Import the ws library.
const WebSocket = require('ws');
// Import the Player class.
const Player = require('./player');

// A map which maps a player's id to its socket socket connection.
// ---Note:
// Positive ids will be dedicated for players joining random sessions,
// whereas negative ids will be dedicated for players joining, or
// hosting, private sessions.
let players = new Map;
// A map which maps a session id to the player id of its host.
let hosts = new Map;

// A websocket server with port 9000.
const server = new WebSocket.Server({
    port: 9000,
});


// A function to generate a unique id for a session.
function generateID(length = 5, digits = "1234567890")
{
    // To store the id.
	let id = "";

    // Until the length of the id is decremented to 0,
    // add a random digit to the id.
	while (length--)
    {
		id += digits[Math.floor(Math.random() * digits.length)];
	}

    // Return the id.
	return id;
}


// Upon establishing a websocket connection with a client.
server.on('connection', socket => {
    // Output a success message.
	console.log("Connection has been established.");

    // Upon receiving a message from a client.
    socket.on('message', message => {
        // Parse the passed JSON string into its original data format.
    	const data = JSON.parse(message);

        // Treat the data differently depending on action value.
        switch (data.action)
        {
            // If the client wants to host a private session.
            case "request host private":
            {
                // Keep track of the ids of this client and its opponent.
                let myPlayerID,
                    opponentPlayerID,
                    mySnakeID = 0,
                    opponentSnakeID = 1;

                // The number of players in the map with negative key
                // ids and are joining a private game.
                let noOfPlayers
                    = [...players.keys()].filter(id => id < 0).length;

                // If this client is the first to host a private session,
                // give it the player id -1.
                if (noOfPlayers == 0)
                {
                    myPlayerID = -1;
                }
                // Otherwise, give it the player id of the previous client - 1.
                else
                {
                    myPlayerID = Math.min(...([...players.keys()])) - 1;
                }

                // Add this client's player id and socket connection
                // to the players map.
                players.set(myPlayerID, new Player(socket));

                // This client's session id.
                let sessionID;

                // Assign a randomly generated session id until the assigned
                // one is not already used.
                do
                {
                    sessionID = generateID();
                }
                while (hosts.has(sessionID));

                // Add this client's session id and player id to the hosts map.
                hosts.set(sessionID, myPlayerID);

                // Send the host details back to this client.
                players.get(myPlayerID).send({
                    action: "host",
                    my_player_id: myPlayerID,
                    my_snake_id: mySnakeID,
                    opponent_snake_id: opponentSnakeID,
                    session_id: sessionID,
                });

                break;
            }
            // If the client wants to join a private session.
            case "request join private":
            {
                // Keep track of the ids of this client and its opponent.
                let myPlayerID,
                    opponentPlayerID = hosts.get(data.session_id);
                    mySnakeID = 1,
                    opponentSnakeID = 0;

                // The number of players in the map with negative key
                // ids and are joining a private game.
                let noOfPlayers
                    = [...players.keys()].filter(id => id < 0).length;

                // If this client is the first to join the private session,
                // an error has occurred.
                if (noOfPlayers == 0)
                {
                    console.log("join failed... no host.");

                    break;
                }
                // Otherwise, give it the player id of the previous client - 1.
                else
                {
                    myPlayerID = Math.min(...([...players.keys()])) - 1;
                }

                // Add this client's player id and socket connection
                // to the players map.
                players.set(myPlayerID, new Player(socket));

                // Send the join details back to this client.
                players.get(myPlayerID).send({
                    action: "join",
                    my_player_id: myPlayerID,
                    opponent_player_id: opponentPlayerID,
                    my_snake_id: mySnakeID,
                    opponent_snake_id: opponentSnakeID,
                });

                // Send this client's player id to the opponent client.
                players.get(opponentPlayerID).send({
                    action: "fetch opponent",
                    opponent_player_id: myPlayerID,
                });

                break;
            }
            // If the client wants to join a random session.
            case "request join random":
            {
                // Keep track of the ids of this client and its opponent.
                let myPlayerID,
                    opponentPlayerID,
                    mySnakeID,
                    opponentSnakeID;

                // The number of players in the map with positive key
                // ids and are joining a random game.
                let noOfPlayers = [...players.keys()].filter(id => id > 0).length;

                // If this client is the first to join a random session,
                // give it the player id 1.
                if (noOfPlayers == 0)
                {
                    myPlayerID = 1;
                }
                // Otherwise, give it the id of 1 + the previous id.
                else
                {
                    myPlayerID
                        = Math.max(...([...players.keys()])) + 1;
                }

                // Add this client's player id and socket connection
                // to the players map.
                players.set(myPlayerID, new Player(socket));

                // Increment the number of players by 1.
                noOfPlayers++;

                // If there are an even number of players in sessions,
                // pair with the client with the player id that is 1 less
                // than this client's player id.
                if (noOfPlayers % 2 == 0)
                {
                    opponentPlayerID = myPlayerID - 1;
                    mySnakeID = 1;
                    opponentSnakeID = 0;
                }
                // Otherwise, pair with the client with the player id that is
                // 1 more than this client's player id.
                else
                {
                    opponentPlayerID = myPlayerID + 1;
                    mySnakeID = 0;
                    opponentSnakeID = 1;
                }

                // Send the join details back to this client.
                players.get(myPlayerID).send({
                    action: "join",
                    my_player_id: myPlayerID,
                    opponent_player_id: opponentPlayerID,
                    my_snake_id: mySnakeID,
                    opponent_snake_id: opponentSnakeID,
                });

                break;
            }
            // If the client is waiting for another client to join.
            case "request players":
            {
                // Send the number of players in the players map
                // back to this client.
                players.get(data.my_player_id).send({
                    action: "fetch players",
                    players: [...players.keys()],
                });

                break;
            }
            // If the client needs one client to be a dedicated food placer.
            case "pick food placer":
            {
                // If the opponent client is not already the food placer,
                // set it to be this client and tell this client.
                if (!players.get(data.opponent_player_id).placesFirstFood)
                {
                    players.get(data.my_player_id).send({
                        action: "place first food",
                    });

                    players.get(data.my_player_id).placeFirstFood(true);
                }

                break;
            }
            // If the client has chosen a tile to contain food.
            case "send food tile":
            {
                // Send the new food tile to the opponent client.
                players.get(data.opponent_player_id).send({
                    action: "fetch food tile",
                    food_tile: data.food_tile,
                });

                break;
            }
            // If the client has altered its readiness.
            case "send my readiness":
            {
                // If the opponent player is ready and this client is now
                // ready, then alert both clients that they are ready to play
                // and set the opponent to be unready for the next round.
                if (players.get(data.opponent_player_id).awaitingReady
                        && data.ready)
                {
                    players.get(data.opponent_player_id).send({
                        action: "ready to play",
                    });

                    players.get(data.my_player_id).send({
                        action: "ready to play",
                    });

                    players.get(data.opponent_player_id).awaitReady(false);
                }
                // Otherwise, set this client to be the ready if necessary
                // and send the readiness of this client to the opponent client.
                else
                {
                    if (data.ready)
                    {
                        players.get(data.my_player_id).awaitReady(true);
                    }

                    players.get(data.opponent_player_id).send({
                        action: "update opponent readiness",
                        ready: data.ready,
                    });
                }

                break;
            }
            // If the client has moved its snake and needs the opponent to know.
            case "send my snake":
            {
                // If the opponent client has already sent its snake to the
                // server, send the snakes to all clients and set the
                // opponents snake to null for the next snake movement.
                if (players.get(data.opponent_player_id).snake != null)
                {
                    players.get(data.opponent_player_id).send({
                        action: "update opponent snake",
                        snake: data.snake,
                    });

                    players.get(data.my_player_id).send({
                        action: "update opponent snake",
                        snake: players.get(data.opponent_player_id).snake,
                    });

                    players.get(data.opponent_player_id).setSnake(null);
                }
                // Otherwise, only this client has sent its snake. So store
                // it until the opponent client sends its snake.
                else
                {
                    players.get(data.my_player_id).setSnake(data.snake);
                }

                break;
            }
            // If the client has crashed its snake, then notify both
            // clients to update the score accordingly.
            case "crash my snake":
            {
                players.get(data.opponent_player_id).send({
                    action: "score my player",
                    snake: data.snake,
                });

                players.get(data.my_player_id).send({
                    action: "score opponent player",
                });

                break;
            }
        }
    });

    // Upon the client closing the connecting.
    socket.on('close', () => {
        // Find the player id of the client who disconnected.
    	const lostPlayerID = [...players.keys()]
            .find(key => players.get(key).socket === socket);

        // Remove that client from the players map,
        // so that no session is associated with the client.
        players.delete(lostPlayerID);

        // Output a closed connection message.
    	console.log("Connection has been closed.");
    });
});