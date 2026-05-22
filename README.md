# leon-travel

A lightweight travel planner with:

- User login and profile (avatar/background, theme settings)
- Trip creation and daily plans
- Expense tracking and export to PDF
- AMap integration (JS API + Web services) for routes/maps

## Quick Start (Docker)

1. Create a local env file from the example:

```bash
cp .env.example .env
```

2. Start services:

```bash
docker compose up -d --build
```

3. Open:

- App: http://localhost:20418
- Health: http://localhost:20418/health

## Configuration

Backend reads the following env vars (see `.env.example`):

- `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT`
- `JWT_SECRET` (required)
- `DEFAULT_ADMIN_PASSWORD` (optional, for first-time admin creation)
- `MAX_UPLOAD_SIZE`, `JSON_BODY_LIMIT`, `CORS_ORIGINS`
- `DB_SYNC_ALTER` (development only; prefer migrations in production)

## AMap Keys

AMap keys are configured in the in-app Settings page:

- JS API Key (Web): for loading AMap JS SDK and interactive maps
- `securityJsCode`: optional, when enabling JS API security
- Web service Key: for static maps / geocoding / related HTTP APIs

## License

MIT. See `LICENSE`.

