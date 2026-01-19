# F76 Trading (minimal)

This repository contains a minimal trading app for Fallout 76 (WTB/WTS/WTT) built with an Express backend and a React + Vite frontend using TailwindCSS.

Features

- Three trade types: WTB, WTS, WTT
- Trades include: Quantity 1, Item 1, Quantity 2, Item 2, in-game username, Discord username
- In-memory API (GET /trades, POST /trades)

Run locally

1. Start the server

```bash
cd server
npm install
npm start
```

2. Start the client (in another terminal)

```bash
cd client
npm install
npm run dev
```

The client expects the API at `http://localhost:4000`. To change, set `VITE_API_URL` in the client environment.

Notes

- This is a minimal scaffold with in-memory storage (server restart clears trades). For production, add a database (Postgres, MongoDB), authentication, and validation.
