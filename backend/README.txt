ATMODESQ BACKEND
================

REST API for the Atmodesq cloud app. It receives sensor measurements from the
Atmodesq Station (fake station for now), evaluates them and serves the data to the web dashboard.

TECHNOLOGIES
------------
- Node.js 24      JavaScript runtime
- Express 5       web framework for the REST API
- PostgreSQL 18   database, runs in a Docker container
- pg              PostgreSQL client, plain SQL (no ORM)
- Docker Compose  starts the database container


HOW TO RUN
----------
Requirements: Node.js 24+ and Docker Desktop (running).

1. Go to the backend folder:
     cd backend

2. Create your local settings file:
     cp .env.example .env

3. Install dependencies:
     npm install

4. Start the database:
     docker compose up -d

5. Create the tables and the demo station:
     npm run db:migrate
     npm run db:seed

6. Start the API:
     npm run dev

7. Check that it works - open in a browser:
     http://localhost:3000/api/v1/health
   Expected answer: {"status":"OK","database":"connected"}


OPTIONAL: TEST DATA WITHOUT HARDWARE
------------------------------------
     npm run fake-station -- --backfill   (send 24 h of history once)
     npm run fake-station                 (one measurement every 10 s)


STOP
----
     Ctrl+C                 stops the API
     docker compose down    stops the database (data is kept)
