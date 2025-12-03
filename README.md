# Articles Application

A full-stack articles management system with workspaces, comments, file attachments, and real-time notifications.

## Features

- **Articles Management**: Create, read, update, and delete articles
- **Workspaces**: Organize articles into workspaces
- **Comments**: Add comments to articles
- **File Attachments**: Upload images and PDFs to articles
- **Real-time Notifications**: WebSocket-based notifications for article changes
- **PostgreSQL Database**: Persistent storage with Sequelize ORM

## Quick Start

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   # Root
   npm install
   
   # Server
   cd server && npm install
   
   # Client
   cd ../client && npm install
   ```

2. **Set up the database:**
   
   See [server/DATABASE_SETUP.md](server/DATABASE_SETUP.md) for detailed instructions.
   
   Quick setup:
   ```bash
   # Create database
   createdb -U postgres articles_db
   
   # Run migrations
   cd server
   npm run db:migrate
   
   # Seed default workspaces (optional)
   npm run db:seed
   ```

3. **Start the application:**
   ```bash
   # From root directory
   npm run dev
   ```
   
   This starts both the backend (port 3001) and frontend (port 5173).

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   └── App.jsx        # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   └── index.js       # Express server
│   ├── models/            # Sequelize models
│   ├── migrations/       # Database migrations
│   ├── config/            # Database configuration
│   └── package.json
└── package.json           # Root package.json
```

## Database Setup

**Important:** The application requires PostgreSQL to be running. See [server/DATABASE_SETUP.md](server/DATABASE_SETUP.md) for:
- Database creation
- Migration instructions
- Configuration options
- Troubleshooting guide

## API Endpoints

### Articles
- `GET /api/articles` - List all articles (supports `?workspaceId=xxx` query)
- `GET /api/articles/:id` - Get article with comments and attachments
- `POST /api/articles` - Create article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article

### Workspaces
- `GET /api/workspaces` - List all workspaces
- `GET /api/workspaces/:id` - Get workspace
- `POST /api/workspaces` - Create workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Comments
- `GET /api/articles/:id/comments` - Get comments for article
- `POST /api/articles/:id/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Attachments
- `POST /api/articles/:id/attachments` - Upload files
- `DELETE /api/articles/:id/attachments/:attachmentId` - Delete attachment
- `GET /api/attachments/:filename` - Serve attachment file

## Development

### Running in Development Mode

```bash
# Start both servers
npm run dev

# Or run separately:
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

### Database Migrations

```bash
cd server

# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Seed default workspaces
npm run db:seed
```

## Technologies

- **Frontend**: React, Vite, ReactQuill
- **Backend**: Node.js, Express, Sequelize
- **Database**: PostgreSQL
- **Real-time**: WebSockets (ws)
- **File Upload**: Multer