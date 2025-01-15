So to add a bot, you have to :

- Know the GAME_ID
- GET https://firestore.googleapis.com/v1/projects/cellularena/databases/(default)/documents/games/${GAME_ID}
- Retrieve the turn, and the state string (not here at the moment ,but could be easily add)
- For each action POST https://firestore.googleapis.com/v1/projects/cellularena/databases/(default)/documents/games/${GAME_ID}/actions with the body

```
curl -X POST \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
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

- PATCH https://firestore.googleapis.com/v1/projects/cellularena/databases/(default)/documents/games/${GAME_ID}
  with body

```
{
    "fields": {
      "waitingForActions.1": {
        "booleanValue": false
      }
    }
  }
```
