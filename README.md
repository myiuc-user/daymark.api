# Daymark - Project Management Backend

Backend API for the project management system.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- pnpm (recommended)

### Installation

1. **Install dependencies**
```bash
pnpm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Setup database**
```bash
# Generate Prisma client
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Seed database (optional)
pnpm run db:seed
```

4. **Start server**
```bash
# Development mode
pnpm run dev

# Production mode
pnpm start
```

## 🔐 Default Admin Account

On first startup, a super admin account is automatically created:
- **Email:** admin@company.com
- **Password:** admin123

⚠️ **Important:** Change these credentials in production!

## 📡 API Endpoints

### Authentication
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout
- `POST /auth/github` - GitHub OAuth login

### Administration (Super Admin only)
- `GET /admin/users` - List all users
- `POST /admin/users` - Create user
- `PUT /admin/users/:id/role` - Update user role
- `PUT /admin/users/:id/status` - Enable/Disable user
- `DELETE /admin/users/:id` - Delete user

### Workspaces
- `GET /workspaces` - List user workspaces
- `POST /workspaces` - Create workspace
- `GET /workspaces/:id` - Get workspace details
- `PUT /workspaces/:id` - Update workspace
- `DELETE /workspaces/:id` - Delete workspace

### Projects
- `GET /projects?workspaceId=:id` - List projects
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Tasks
- `GET /tasks?projectId=:id` - List tasks
- `POST /tasks` - Create task
- `GET /tasks/:id` - Get task details
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `POST /tasks/:id/comments` - Add comment
- `PATCH /tasks/:id/favorite` - Toggle favorite
- `PATCH /tasks/:id/archive` - Toggle archive

### Subtasks
- `GET /tasks/:id/subtasks` - List subtasks
- `POST /tasks/:id/subtasks` - Create subtask
- `PATCH /tasks/:id/subtasks/toggle-status` - Toggle subtask status (TODO/DONE)

### Team Management
- `POST /teams/invite` - Invite member
- `POST /teams/accept-invitation` - Accept invitation
- `POST /teams/project-role` - Assign project role
- `POST /teams/assign-multiple` - Bulk assign members

### Collaboration
- `POST /collaboration/mentions` - Create mention
- `POST /collaboration/watchers/:taskId` - Add task watcher
- `GET /collaboration/watchers/:taskId` - Get task watchers

### Sprints & Milestones
- `GET /sprints?projectId=:id` - List sprints
- `POST /sprints` - Create sprint
- `PUT /sprints/:id/activate` - Activate sprint
- `GET /milestones?projectId=:id` - List milestones
- `POST /milestones` - Create milestone

### Time Tracking
- `GET /time-entries` - List time entries
- `POST /time-entries` - Log time
- `GET /time-entries/summary` - Get summary

### Templates
- `GET /templates` - List templates
- `POST /templates` - Create template
- `POST /templates/:id/use` - Use template

### Workflows
- `GET /workflows?projectId=:id` - List workflow states
- `POST /workflows` - Create workflow state
- `POST /workflows/init-project/:id` - Initialize project workflow

### Files
- `POST /files/upload` - Upload file
- `GET /files/:id` - Download file
- `DELETE /files/:id` - Delete file

### Analytics
- `GET /analytics/project/:id` - Project analytics
- `GET /analytics/team` - Team analytics

### Search
- `GET /search?q=:query` - Global search

## 🔒 Authentication

The API uses JWT with two tokens:
- **Access Token:** 15 minutes (Authorization header)
- **Refresh Token:** 7 days (httpOnly cookie)

### Required Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 🏗️ Project Structure

```
src/
├── controllers/     # Request handlers
├── middleware/      # Auth, validation, error handling
├── routes/          # Route definitions
├── services/        # Business logic
├── utils/           # Validation, helpers
└── config/          # Database, routes configuration
```

## 🗄️ Database

### Main Models
- **User:** Users with roles (SUPER_ADMIN, ADMIN, MEMBER)
- **Workspace:** Workspaces with members
- **Project:** Projects within workspaces
- **Task:** Tasks with assignments, subtasks, story points, and time tracking
- **Comment:** Task comments with mentions
- **Sprint:** Agile sprints
- **Milestone:** Project milestones
- **TimeEntry:** Time tracking entries
- **ProjectTemplate:** Reusable project templates
- **WorkflowState:** Custom task states
- **TaskWatcher:** Task followers
- **Mention:** Comment mentions

### Prisma Commands
```bash
# Generate client
pnpm run db:generate

# Create migration
pnpm run db:migrate

# Reset database
pnpm run db:reset

# Seed database
pnpm run db:seed
```

## 🔧 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/daymark
DIRECT_URL=postgresql://user:password@localhost:5432/daymark

# JWT
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Admin
ROOT_ADMIN_EMAIL=admin@company.com
ROOT_ADMIN_PASSWORD=admin123

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 🚨 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT with short expiration
- Data validation with Zod
- CORS configured
- Helmet for security headers
- httpOnly cookies for refresh tokens
- Rate limiting on sensitive endpoints
- Database connection retry logic (5 attempts)

## 📝 Development

### Start in dev mode
```bash
pnpm run dev
```

### Database operations
```bash
# Generate Prisma client
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Reset database
pnpm run db:reset

# Seed database
pnpm run db:seed
```

## 🚀 Deployment

1. Set production environment variables
2. Setup PostgreSQL database
3. Run migrations: `pnpm run db:deploy`
4. Start server: `pnpm start`

## 📋 Roadmap

See [TODO.md](./TODO.md) for backend features and improvements.

For frontend features, see [daymark.app TODO](../daymark.app/TODO.md)

## 📞 Support

For questions or issues, consult the documentation or contact the development team.
