# Database setup (Postgres + Sequelize)

This project includes a minimal Sequelize setup and a migration to create an `articles` table.

Quick start (recommended using Docker Compose):

1. Start a local Postgres container:

```powershell
docker-compose up -d
```

This spins up Postgres at `localhost:5432` with user `postgres` / password `postgres`, and database `articles_db`.

2. Install server dependencies (from the repository root):

```powershell
cd server
npm install
```

3. Run migrations:

```powershell
npm run db:migrate
```

This will create the `articles` table with columns: `id` (UUID), `title`, `content`, `createdAt`, `updatedAt`.

Notes:
- Configuration is in `server/config/config.cjs` and is driven by environment variables. See `server/.env.example`.
- Sequelize CLI configuration is in `server/.sequelizerc` and migrations are in `server/migrations`.
