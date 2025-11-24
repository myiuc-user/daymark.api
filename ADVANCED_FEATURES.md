# Fonctionnalités Avancées - Daymark API

## 🎯 Nouvelles Fonctionnalités Implémentées

### 1. 👥 Gestion des Équipes/Membres

**Endpoints :**
- `POST /api/teams/invite` - Inviter un membre
- `POST /api/teams/accept-invitation` - Accepter une invitation
- `POST /api/teams/project-role` - Assigner un rôle projet
- `POST /api/teams/assign-multiple` - Assignation multiple

**Fonctionnalités :**
- Invitations par email avec tokens sécurisés
- Rôles granulaires par workspace (ADMIN, MEMBER)
- Rôles par projet (ADMIN, MEMBER, VIEWER)
- Assignation multiple sur les tâches

### 2. 🤝 Collaboration Avancée

**Endpoints :**
- `POST /api/collaboration/mentions` - Créer des mentions
- `POST /api/collaboration/watchers/:taskId` - Ajouter un watcher
- `GET /api/collaboration/watchers/:taskId` - Liste des watchers

**Fonctionnalités :**
- Mentions (@user) dans les commentaires
- Système de watchers pour suivre les tâches
- Notifications automatiques

### 3. 📅 Planification

**Milestones :**
- `GET /api/milestones?projectId=:id` - Liste des jalons
- `POST /api/milestones` - Créer un jalon
- `PUT /api/milestones/:id` - Modifier un jalon

**Sprints :**
- `GET /api/sprints?projectId=:id` - Liste des sprints
- `POST /api/sprints` - Créer un sprint
- `PUT /api/sprints/:id/activate` - Activer un sprint

**Fonctionnalités :**
- Jalons avec dates d'échéance
- Sprints Agile avec activation
- Timeline des projets

### 4. 💰 Gestion des Ressources

**Time Tracking :**
- `GET /api/time-entries` - Entrées de temps
- `POST /api/time-entries` - Enregistrer du temps
- `GET /api/time-entries/summary` - Résumé par projet

**Templates :**
- `GET /api/templates` - Liste des templates
- `POST /api/templates` - Créer un template
- `POST /api/templates/:id/use` - Utiliser un template

**Fonctionnalités :**
- Suivi du temps par tâche
- Estimation vs temps réel
- Templates de projets réutilisables
- Gestion des budgets

### 5. ⚙️ Workflow Avancé

**Endpoints :**
- `GET /api/workflows?projectId=:id` - États du workflow
- `POST /api/workflows` - Créer un état
- `POST /api/workflows/init-project/:id` - Initialiser workflow

**Fonctionnalités :**
- États personnalisés des tâches
- Workflows par projet
- Couleurs et ordre personnalisables

## 🗄️ Nouveaux Modèles de Base de Données

### Milestone
```sql
- id, name, description, dueDate
- projectId, completed
- Relations: Project, Tasks
```

### Sprint
```sql
- id, name, goal, startDate, endDate
- projectId, active
- Relations: Project, Tasks
```

### TimeEntry
```sql
- id, description, hours, date
- userId, taskId
- Relations: User, Task
```

### ProjectTemplate
```sql
- id, name, description, data
- createdById, isPublic
- Relations: User
```

### WorkflowState
```sql
- id, name, color, order
- projectId, isDefault
- Relations: Project, Tasks
```

### TaskWatcher
```sql
- id, userId, taskId
- Relations: User, Task
```

### Mention
```sql
- id, userId, commentId
- Relations: User, Comment
```

## 🚀 Migration

Pour appliquer ces changements :

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer la migration
psql -d your_database -f prisma/migrations/add_advanced_features.sql

# Ou utiliser Prisma migrate
npx prisma db push
```

## 📋 Exemples d'Utilisation

### Créer un Sprint
```javascript
POST /api/sprints
{
  "name": "Sprint 1",
  "goal": "Fonctionnalités de base",
  "startDate": "2024-01-15T00:00:00Z",
  "endDate": "2024-01-29T00:00:00Z",
  "projectId": "project-id"
}
```

### Enregistrer du Temps
```javascript
POST /api/time-entries
{
  "description": "Développement API",
  "hours": 2.5,
  "taskId": "task-id"
}
```

### Inviter un Membre
```javascript
POST /api/teams/invite
{
  "workspaceId": "workspace-id",
  "email": "user@example.com",
  "role": "MEMBER"
}
```

Ces fonctionnalités transforment Daymark en une plateforme de gestion de projet complète et professionnelle.