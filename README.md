# 🚀 TaskFlow — Team Task Manager

A production-grade team task management application built with modern web technologies.

## ✨ Features

### Core
- **Project Management** — Create, update, archive projects with deadlines
- **Task Management** — Full CRUD with status, priority, due dates, subtasks
- **Kanban Board** — Drag-and-drop task management across columns
- **List View** — Sortable, filterable table view with inline status updates
- **Team Collaboration** — Invite members, assign roles (Owner/Manager/Member/Viewer)
- **Comments & Attachments** — Discuss tasks and share files

### Advanced
- **Dashboard & Analytics** — Personal stats, donut/bar charts with Recharts
- **Real-time Notifications** — Socket.io powered live updates
- **Role-Based Access Control** — Two-layer RBAC (global + project-level)
- **JWT Authentication** — Access + refresh token strategy
- **Email Notifications** — Task assignments, project invites, password reset
- **Overdue Detection** — Automatic cron job with notifications
- **Dark Mode** — Full dark/light theme toggle
- **Global Search** — Ctrl+K command palette
- **CSV Export** — Export task lists
- **Activity Audit Trail** — Complete action logging

## 🔑 Demo Credentials

| Role    | Email             | Password     |
|---------|-------------------|-------------|
| Admin   | admin@demo.com    | Admin@123   |
| Manager | manager@demo.com  | Manager@123 |
| Member  | alice@demo.com    | Alice@123   |
| Member  | bob@demo.com      | Bob@123     |

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js v20+ | Runtime |
| Express.js | Web framework |
| PostgreSQL | Database |
| Prisma | ORM |
| JWT | Authentication |
| Zod | Validation |
| Socket.io | Real-time |
| Nodemailer | Email |
| node-cron | Background jobs |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 (Vite) | UI framework |
| Tailwind CSS v4 | Styling |
| Zustand | State management |
| TanStack Query v5 | Data fetching |
| React Router v6 | Routing |
| Recharts | Charts |
| React Hook Form + Zod | Forms |
| Lucide React | Icons |

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Demo data seeder
│   ├── src/
│   │   ├── config/             # Database & email config
│   │   ├── middleware/         # Auth, roles, validation, errors
│   │   ├── modules/           # Feature modules (auth, users, projects, tasks, etc.)
│   │   ├── utils/             # Helpers (ApiError, ApiResponse, JWT, etc.)
│   │   ├── socket/            # Socket.io setup
│   │   ├── jobs/              # Cron jobs
│   │   └── app.js             # Express app
│   └── server.js              # Entry point
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios instance + API functions
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── store/             # Zustand stores
│   │   ├── utils/             # Constants & helpers
│   │   ├── App.jsx            # Main app with routing
│   │   └── main.jsx           # Entry point
│   └── vite.config.js
├── .github/workflows/         # CI/CD
├── railway.toml               # Railway config
└── README.md
```

## 🚀 Local Setup

### Prerequisites
- Node.js v20+
- PostgreSQL (local or remote)
- npm

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd team-task-manager
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets
npm install
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 4. Open in browser
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

## 🔧 Environment Variables

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@localhost:5432/taskmanager |
| JWT_ACCESS_SECRET | Access token secret | your-secret-key |
| JWT_REFRESH_SECRET | Refresh token secret | your-refresh-secret |
| JWT_ACCESS_EXPIRES | Access token expiry | 15m |
| JWT_REFRESH_EXPIRES | Refresh token expiry | 7d |
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| CLIENT_URL | Frontend URL (for CORS) | http://localhost:5173 |
| EMAIL_HOST | SMTP host | smtp.gmail.com |
| EMAIL_USER | SMTP user | your-email@gmail.com |
| EMAIL_PASS | SMTP password | your-app-password |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5000 |
| VITE_SOCKET_URL | Socket.io URL | http://localhost:5000 |

## 📡 API Endpoints

### Auth (`/api/auth`)
- `POST /register` — Register user
- `POST /login` — Login (returns access token + refresh cookie)
- `POST /logout` — Logout
- `POST /refresh-token` — Refresh access token
- `GET /me` — Current user profile
- `PATCH /me` — Update profile
- `POST /forgot-password` — Send reset email
- `POST /reset-password` — Reset password
- `GET /verify-email/:token` — Verify email

### Projects (`/api/projects`)
- `POST /` — Create project
- `GET /` — List projects (paginated)
- `GET /:id` — Project details
- `PATCH /:id` — Update project
- `DELETE /:id` — Delete project
- `GET /:id/stats` — Project statistics
- `GET /:id/activity` — Activity log
- `POST /:id/members` — Invite member
- `GET /:id/members` — List members
- `PATCH /:id/members/:userId/role` — Change member role
- `DELETE /:id/members/:userId` — Remove member

### Tasks (`/api/projects/:projectId/tasks`)
- `POST /` — Create task
- `GET /` — List tasks (filtered)
- `GET /:taskId` — Task detail
- `PATCH /:taskId` — Update task
- `DELETE /:taskId` — Delete task
- `PATCH /:taskId/status` — Quick status update
- `PATCH /:taskId/assign` — Assign task
- `PATCH /:taskId/reorder` — Reorder (Kanban)
- `POST /:taskId/subtasks` — Create subtask
- `GET /:taskId/subtasks` — List subtasks

### Comments (`/api/tasks/:taskId/comments`)
- `POST /` — Add comment
- `GET /` — List comments
- `PATCH /:commentId` — Edit comment
- `DELETE /:commentId` — Delete comment

### Notifications (`/api/notifications`)
- `GET /` — List notifications
- `PATCH /:id/read` — Mark read
- `PATCH /read-all` — Mark all read
- `DELETE /:id` — Delete

### Dashboard (`/api/dashboard`)
- `GET /` — Personal dashboard stats

### Admin (`/api/admin`) — Admin only
- `GET /stats` — Platform stats
- `GET /users` — All users
- `GET /activity` — All activity

## 🔒 Access Control Matrix

| Action | VIEWER | MEMBER | MANAGER | OWNER | ADMIN |
|--------|--------|--------|---------|-------|-------|
| View project/tasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create task | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update own task | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update any task | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete task | ❌ | ❌ | ✅ | ✅ | ✅ |
| Invite member | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit project | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete project | ❌ | ❌ | ❌ | ✅ | ✅ |

## 📋 Known Limitations / Future Improvements
- File uploads stored locally (should use S3/Cloudinary in production)
- No WebSocket reconnection strategy yet
- Search is basic (could add Elasticsearch)
- No unit/integration tests yet
- Email verification is optional (not enforced)

## 📄 License
MIT
