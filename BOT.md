So to add a bot, you have to :

- Know the GAME_ID
- GET https://firestore.googleapis.com/v1/projects/cellularena/databases/(default)/documents/games/${GAME_ID}
- Retrieve the turn, and the state string
  {
  turn: 5,
  serializedState: "18 9\n52\n5\n0 WALL -1 0 X 0 0\n6 0 WALL -1 0 X 0 0..."
  }

- For each action POST https://firestore.googleapis.com/v1/projects/cellularena/databases/(default)/documents/games/${GAME_ID}/actions with the body

```
curl -X POST \
  -H "Content-Type: application/json" \
  https://firestore.googleapis.com/v1/projects/cellularena/databases/(default)/documents/games/${GAME_ID}/actions \
  -d '{
    "fields": {
      "actionType": { "stringValue": "GROW" },
      "direction": { "stringValue": "N" },
      "id": { "stringValue": "uuidv4" },
      "organId": { "integerValue": 1 },
      "playerId": { "integerValue": 1 },
      "turn": { "integerValue": 1 },
      "type": { "stringValue": "SPORER" },
      "x": { "integerValue": 3 },
      "y": { "integerValue": 3 }
    }
  }'
```

Then update the game to say that the bot has played its turn:

```
curl -X PATCH \
  -H "Content-Type: application/json" \
  https://firestore.googleapis.com/v1/projects/cellularena/databases/(default)/documents/games/${GAME_ID} \
  -d '{
    "fields": {
      "waitingForActions.1": {
        "booleanValue": false
      }
    }
  }'
```
