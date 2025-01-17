So to add a bot, you have to :

- Retrieve all games where the bot is playing

```bash
  curl -X POST "https://firestore.googleapis.com/v1/projects/cellularena/databases/(default)/documents:runQuery" \
  -H "Content-Type: application/json" \
  -d '{
    "structuredQuery": {
      "from": [
        {
          "collectionId": "games"
        }
      ],
      "where": {
        "compositeFilter": {
          "op": "AND",
          "filters": [
            {
              "unaryFilter": {
                "field": { "fieldPath": "winner" },
                "op": "IS_NULL",
              }
            },
            {
              "fieldFilter": {
                "field": { "fieldPath": "mode" },
                "op": "EQUAL",
                "value": { "stringValue": "solo" }
              }
            },
            {
              "fieldFilter": {
                "field": { "fieldPath": "botName" },
                "op": "EQUAL",
                "value": { "stringValue": "reCurse" }
              }
            },
            {
              "fieldFilter": {
                "field": { "fieldPath": "waitingForActions.`1`" },
                "op": "EQUAL",
                "value": { "booleanValue": true }
              }
            }
          ]
        }
      }
    }
  }'
```

- For each game, retrieve the turn, and the state string
  {
  turn: 5,
  serializedState: "18 9\n52\n5\n0 WALL -1 0 X 0 0\n6 0 WALL -1 0 X 0 0..."
  }

- If you want to retrive only one game : GET https://firestore.googleapis.com/v1/projects/cellularena/databases/(default)/documents/games/${GAME_ID}

- For each action POST https://firestore.googleapis.com/v1/projects/cellularena/databases/(default)/documents/games/${GAME_ID}/actions with the body

```bash
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

```bash
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
