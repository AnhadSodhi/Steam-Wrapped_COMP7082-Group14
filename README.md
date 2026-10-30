# Steam Wrapped

Steam Wrapped turns a public Steam profile into a personalised summary of
gaming habits, favourite genres, playtime, and achievements.

## Project structure

- [`frontend/`](./frontend/) - Next.js application and user interface.
- [`backend/`](./backend/) - Express API that fetches data from Steam.
- [`docs/diagrams/`](./docs/diagrams/) - PlantUML architecture and interaction diagrams.

## Running locally

The backend requires a Steam Web API key. Create `backend/.env` with:

```env
STEAM_API_KEY=your_key_here
```

Start the backend:

```bash
cd backend
npm install
npm run dev
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and search for a public
Steam profile. The frontend expects the backend at
`http://localhost:3001`; set `BACKEND_URL` in `frontend/.env` to override it.

## Architecture diagrams

PlantUML source diagrams for the application are available in [`docs/diagrams/`](./docs/diagrams/):

- [Component architecture diagram](./docs/diagrams/component-architecture.puml) - high-level client, server, Steam API, and planned quiz interactions.
- [Class diagram](./docs/diagrams/class-diagram.puml) - frontend components, backend services, and Steam API data.
- [Profile search sequence diagram](./docs/diagrams/profile-search-sequence.puml) - searching for a user and viewing their information.
- [Summary card sequence diagram](./docs/diagrams/summary-card-sequence.puml) - generating, downloading, and sharing a user's stats card.
- [Profile search state diagram](./docs/diagrams/profile-search-state.puml) - states from entering a search through displaying the dashboard.

The `.puml` files can be rendered with [PlantUML](https://plantuml.com/) or a PlantUML editor extension.