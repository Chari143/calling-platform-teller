Objective

Build an async REST + WebSocket service that simulates a calling platform.

Users can initiate calls, which automatically progress through states until completion. The service must manage call
 state globally, enforce limits, and handle background recording uploads — all containerized via Docker Compose.

Requirements

Core Functionality

POST /calls: Initiates a new call (from, to, optional metadata).
Enforce per-API-key concurrent calls and calls per second (CPS) limits.
Each call automatically follows a randomized path:
Either answered → completed or unanswered → completed.
Return the call_id and a WebSocket URL clients can connect to for real-time updates.
WebSocket endpoint: broadcasts state transitions in real time (QUEUED → RINGING → ANSWERED/UNANSWERED → COMPLETED).
GET /calls/{id}: Fetch current call state.
GET /metrics: Basic metrics (total, active, CPS, uploads).
All requests require an API key via
Authorization: Bearer <API_KEY>.
State Management

Maintain live call state in Redis.
Periodically persist call data to PostgreSQL/MySQL.
Rate Limiting 

Enforce both: 

Concurrent call limit (e.g., 3 active per API key) 
CPS limit (e.g., 2 new calls/sec) 
Return { "error": "Rate limit exceeded" } on violations. 

Recording Upload

When a call reaches COMPLETED, trigger a background job that:

Uploads a static mock audio file (e.g. mock_recording.mp3) to S3 or mock bucket.
Updates the call record with the recording URL. This must be async and non-blocking.
Stack & Setup

Language: FastAPI or Node.js (Express/NestJS) with async I/O.
Data: PostgreSQL/MySQL, Redis for cache.
Jobs: Celery, RQ, or similar.
Include Docker Compose with all components:
API service, Redis, Database, Worker.
Deliverables

Source code with clean structure and comments.
README.md with setup steps, usage examples, and API overview.
Working Docker Compose environment.
Schema/migrations for DB.
Bonus (Optional)

Prometheus-style /metrics endpoint.
Configurable API keys and limits stored in DB.
Deployed version (AWS/ Render / Fly.io / Railway).
Basic unit tests.  