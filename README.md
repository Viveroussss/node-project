Simple Articles App (React + Node.js)

- React frontend (Vite) with list, view, create, and edit (WYSIWYG)
- Node.js (Express) backend storing JSON files on disk

Project Structure

```
.
├─ client/
│  ├─ src/
│  │  ├─ App.jsx, App.css
│  │  ├─ components/
│  │  │  ├─ ArticlesList/@ArticlesList.jsx, ArticlesList.css
│  │  │  ├─ ArticleView/@ArticleView.jsx, ArticleView.css
│  │  │  ├─ NewArticleForm/@NewArticleForm.jsx, NewArticleForm.css
│  │  │  ├─ EditArticleModal/@EditArticleModal.jsx, EditArticleModal.css
│  │  │  └─ Button/@Button.jsx, Button.css
│  │  └─ main.jsx
│  └─ package.json
├─ server/
│  ├─ src/index.js
│  ├─ data/  # sample data (JSON files)
│  └─ package.json
└─ package.json (workspace dev script)
```

Setup

1) Install dependencies

```
cd server && npm install
cd ../client && npm install
cd .. && npm install  # installs root dev tooling (concurrently)
```

2) Run in development

Option A: single command from repo root

```
npm run dev
```

Option B: run separately in two terminals

```
# Terminal 1 (backend)
cd server && npm run dev

# Terminal 2 (frontend)
cd client && npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Scripts

- Root: `npm run dev` → runs FE and BE concurrently
- Client: `npm run dev` | `npm run build` | `npm run preview`
- Server: `npm run dev` | `npm start`

Sample Data

- The backend reads JSON articles from `server/data/` on disk. You can seed by adding files with shape:

```
{
  "id": "someId",
  "title": "Hello",
  "content": "<p>World</p>",
  "createdAt": 1690000000000
}
```

API

- GET /api/articles
- GET /api/articles/:id
- POST /api/articles { title, content }
- PUT /api/articles/:id { title, content }
- DELETE /api/articles/:id

