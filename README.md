Calling Platform (Node.js + TypeScript)

Overview
- This app simulates a phone calling platform.
- You start a call with a REST request. The call automatically moves through states and finishes.
- The app sends real-time updates over WebSocket.
- After a call finishes, a mock recording file is saved and a URL is stored.

Architecture
- REST API with Express
- WebSocket events with ws
- Redis for live state and rate limits
- BullMQ worker for background jobs
- PostgreSQL via Prisma for data storage
- Docker Compose to run everything
- Basic unit tests

Quick Start (Docker Compose)
1) Install Docker and Docker Compose
2) In the project root, run:
   - `docker compose up --build -d`
3) API runs on `http://localhost:3000`

Authentication
- All requests must send an API key using the header:
  - `Authorization: Bearer <API_KEY>`

API Endpoints
- `POST /calls`
  - Body: `{ "from": "string", "to": "string"}`
  - Returns: `{ "call_id": "string", "ws_url": "ws://.../ws?call_id=..." }`
  - Behavior: Creates a call with state `QUEUED`; worker moves it to `RINGING`, then `ANSWERED` or `UNANSWERED`, then `COMPLETED`.

- `GET /calls/{id}`
  - Returns the current call data and state.
  - When `COMPLETED`, you also get `recordingUrl`.

- `GET /metrics`
  - Returns basic stats: `{ total, active, cps, uploads }`.

WebSocket
- Connect to: `ws://<HOST>/ws?call_id=<CALL_ID>`
- Include header: `Authorization: Bearer <API_KEY>`
- You will receive JSON messages with live state transitions, for example:
  - `{"id":"<CALL_ID>","state":"RINGING"}`
  - `{"id":"<CALL_ID>","state":"ANSWERED"}` or `UNANSWERED`
  - `{"id":"<CALL_ID>","state":"COMPLETED","recordingUrl":"http://.../uploads/<CALL_ID>.mp3"}`

Rate Limits
- Per API key:
  - Concurrent calls limit (default `3`)
  - Calls per second (CPS) limit (default `2`)
- If you exceed a limit, the API returns: `{ "error": "Rate limit exceeded" }`

Recording Uploads
- After the call is `COMPLETED`, a worker saves a small mock MP3 file to `uploads/`.
- The recording URL is served by the API at `/uploads/<CALL_ID>.mp3`.

Environment Variables
- `PORT` – API port (default `3000`)
- `REDIS_URL` – Redis URL
- `DATABASE_URL` – Postgres URL
- `PUBLIC_BASE_URL` – Base URL for building recording links
- `CONCURRENCY_LIMIT` – Max active calls per API key
- `CPS_LIMIT` – Max new calls per second per API key

Examples (Local)
1) Create a call:
   - `curl -X POST 'http://localhost:3000/calls' -H 'Authorization: Bearer test' -H 'Content-Type: application/json' -d '{"from":"111","to":"222"}'`
2) Get call state:
   - `curl 'http://localhost:3000/calls/<CALL_ID>' -H 'Authorization: Bearer test'`
3) Metrics:
   - `curl 'http://localhost:3000/metrics' -H 'Authorization: Bearer test'`
4) WebSocket: connect using your client to the `ws_url` returned by `POST /calls` and send the `Authorization` header.

