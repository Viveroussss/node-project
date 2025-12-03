# Database Setup Guide

This guide will help you set up the PostgreSQL database for the Articles application.

## Prerequisites

- PostgreSQL installed and running
- Node.js and npm installed

## Step 1: Create Database

Create a PostgreSQL database:

```bash
# Using psql
psql -U postgres
CREATE DATABASE articles_db;
\q

# Or using createdb command
createdb -U postgres articles_db
```

## Step 2: Configure Database Connection

The application uses environment variables for database configuration. You can either:

**Option A: Set environment variables**
```bash
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export POSTGRES_DB=articles_db
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
```

**Option B: Use default values**
The application will use these defaults if environment variables are not set:
- User: `postgres`
- Password: `postgres`
- Database: `articles_db`
- Host: `localhost`
- Port: `5432`

## Step 3: Run Migrations

Run the database migrations to create all tables:

```bash
cd server
npm run db:migrate
```

**Important:** Migrations run in alphabetical order. The migrations are named to ensure proper execution order:
1. `20251126-create-articles.cjs` - Creates articles table
2. `20251126-001-create-workspaces.cjs` - Creates workspaces table
3. `20251126-003-add-workspace-to-articles.cjs` - Adds workspaceId to articles
4. `20251126-004-create-comments.cjs` - Creates comments table
5. `20251126-create-attachments.cjs` - Creates attachments table (if exists)
6. `20251126-change-articles-id-to-string.cjs` - Changes article ID type (if exists)

This will create the following tables:
- `workspaces` - Workspace management
- `articles` - Article storage
- `comments` - Comments on articles
- `attachments` - File attachment metadata

## Step 4: Seed Default Workspaces (Optional)

To create default workspaces (Personal, Work, Projects):

```bash
npm run db:seed
```

## Step 5: Start the Application

Start the server:

```bash
npm run dev
```

**Important Notes:**
- The server will attempt to connect to the database on startup
- If the connection fails, you'll see a warning but the server will still start
- However, **database operations will fail** with 503 errors until the database is properly connected
- The application requires a database connection for articles, comments, and workspaces to function
- Attachments are still stored as files on the filesystem

## Migration Commands

- **Run migrations**: `npm run db:migrate`
- **Undo last migration**: `npm run db:migrate:undo`
- **Seed workspaces**: `npm run db:seed`

## Troubleshooting

### Connection Refused (ECONNREFUSED)
**Symptoms:** API returns 503 errors with "Database not available" message

**Solutions:**
1. Ensure PostgreSQL is running:
   ```bash
   # Linux/Mac
   sudo systemctl status postgresql
   # or
   pg_isready
   
   # Windows
   # Check Services (services.msc) for PostgreSQL service
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -l
   # Look for articles_db in the list
   ```

3. Check connection settings match your PostgreSQL setup:
   - Default: `localhost:5432`, user `postgres`, password `postgres`, database `articles_db`
   - Update via environment variables if different

4. Test connection manually:
   ```bash
   psql -U postgres -d articles_db -h localhost
   ```

### Authentication Failed
- Verify username and password in environment variables
- Check PostgreSQL authentication settings in `pg_hba.conf`
- On Windows, ensure PostgreSQL service is running

### Migration Errors
- Ensure all previous migrations have run successfully
- Check database permissions for the user
- Review migration files in `server/migrations/`
- If migrations fail, you can undo the last one: `npm run db:migrate:undo`

### API Returns 503 Errors
If you see "Database not available" errors:
1. Check that PostgreSQL is running
2. Verify migrations have been executed: `npm run db:migrate`
3. Check server console for detailed error messages
4. Ensure database connection settings are correct

## Database Schema

### Workspaces
- `id` (STRING, Primary Key)
- `name` (STRING, Required)
- `description` (TEXT, Optional)
- `createdAt`, `updatedAt` (Timestamps)

### Articles
- `id` (STRING, Primary Key)
- `title` (STRING, Required)
- `content` (TEXT, Required)
- `workspaceId` (STRING, Foreign Key to workspaces)
- `createdAt`, `updatedAt` (Timestamps)

### Comments
- `id` (STRING, Primary Key)
- `articleId` (STRING, Foreign Key to articles)
- `content` (TEXT, Required)
- `author` (STRING, Default: 'Anonymous')
- `createdAt`, `updatedAt` (Timestamps)

### Attachments
- `id` (STRING, Primary Key)
- `articleId` (STRING, Foreign Key to articles)
- `filename` (STRING, Required)
- `originalName` (STRING)
- `mimetype` (STRING)
- `size` (INTEGER)
- `path` (STRING, Required)
- `uploadedAt` (DATE, Required)
- `createdAt`, `updatedAt` (Timestamps)

