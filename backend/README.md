# Steam Wrapped Backend

A Node.js backend server for the Steam Wrapped project.

## Getting Started

First, run the development server:

```bash
npm run dev
```

To run the server without watch mode:

```bash
npm start
```

The server runs on [http://localhost:3001](http://localhost:3001) by default. Set the `PORT` environment variable to use a different port.

## Health Check

Check that the backend is running by sending a `GET` request to [`/health`](http://localhost:3001/health):

```bash
curl http://localhost:3001/health
```

The endpoint responds with:

```json
{
  "status": "ok"
}
```
