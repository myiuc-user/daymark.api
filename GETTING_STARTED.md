# 🚀 Guide de Démarrage - NestJS Migration

## ✅ Prérequis

- Node.js 18+
- PostgreSQL 12+
- pnpm (recommandé)

## 📦 Installation

### 1. Installer les dépendances
```bash
pnpm install
```

### 2. Configurer les variables d'environnement
```bash
cp .env.example .env
```

Éditer `.env` avec vos paramètres :
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
```

### 3. Préparer la base de données

#### Générer le client Prisma
```bash
pnpm run db:generate
```

#### Exécuter les migrations
```bash
pnpm run db:migrate
```

#### (Optionnel) Réinitialiser la base de données
```bash
pnpm run db:reset
```

#### (Optionnel) Seeder la base de données
```bash
pnpm run db:seed
```

## 🏃 Démarrage

### Mode Développement
```bash
pnpm run dev
```

Le serveur démarre sur `http://localhost:3001`

### Mode Production

#### Build
```bash
pnpm run build
```

#### Démarrer
```bash
pnpm start
```

## 🧪 Tests

### Tests Unitaires
```bash
pnpm test
```

### Tests d'Intégration
```bash
pnpm test:e2e
```

### Couverture de Tests
```bash
pnpm test:cov
```

## 📡 Endpoints Disponibles

### Authentication
- `POST /auth/login` - Connexion
- `GET /auth/me` - Profil utilisateur
- `POST /auth/logout` - Déconnexion

### Users
- `GET /users` - Lister les utilisateurs
- `GET /users/:id` - Obtenir un utilisateur
- `PUT /users/:id` - Mettre à jour un utilisateur
- `DELETE /users/:id` - Supprimer un utilisateur (Admin)

### Workspaces
- `GET /workspaces` - Lister les espaces de travail
- `POST /workspaces` - Créer un espace de travail
- `GET /workspaces/:id` - Obtenir un espace de travail
- `PUT /workspaces/:id` - Mettre à jour un espace de travail
- `DELETE /workspaces/:id` - Supprimer un espace de travail

### Projects
- `GET /projects?workspaceId=:id` - Lister les projets
- `POST /projects` - Créer un projet
- `GET /projects/:id` - Obtenir un projet
- `PUT /projects/:id` - Mettre à jour un projet
- `DELETE /projects/:id` - Supprimer un projet

### Tasks
- `GET /tasks?projectId=:id` - Lister les tâches
- `POST /tasks` - Créer une tâche
- `GET /tasks/:id` - Obtenir une tâche
- `PUT /tasks/:id` - Mettre à jour une tâche
- `DELETE /tasks/:id` - Supprimer une tâche

### Comments
- `GET /comments/:taskId` - Lister les commentaires
- `POST /comments` - Créer un commentaire
- `PUT /comments/:id` - Mettre à jour un commentaire
- `DELETE /comments/:id` - Supprimer un commentaire

### Admin
- `GET /admin/users` - Lister tous les utilisateurs (Admin)
- `PUT /admin/users/:id/role` - Changer le rôle (Admin)
- `PUT /admin/users/:id/status` - Activer/Désactiver (Admin)
- `DELETE /admin/users/:id` - Supprimer un utilisateur (Admin)

### Files
- `POST /files/upload` - Uploader un fichier
- `GET /files/:id` - Télécharger un fichier
- `DELETE /files/:id` - Supprimer un fichier

### Notifications
- `GET /notifications` - Lister les notifications
- `PATCH /notifications/:id/read` - Marquer comme lu
- `DELETE /notifications/:id` - Supprimer une notification

### Analytics
- `GET /analytics/project/:id` - Analytique du projet
- `GET /analytics/team/:workspaceId` - Analytique de l'équipe

### GitHub
- `POST /github/auth` - Authentification GitHub
- `POST /github/sync` - Synchroniser les issues

### Milestones
- `GET /milestones?projectId=:id` - Lister les jalons
- `POST /milestones` - Créer un jalon
- `PUT /milestones/:id` - Mettre à jour un jalon
- `DELETE /milestones/:id` - Supprimer un jalon

### Sprints
- `GET /sprints?projectId=:id` - Lister les sprints
- `POST /sprints` - Créer un sprint
- `PUT /sprints/:id` - Mettre à jour un sprint
- `PUT /sprints/:id/activate` - Activer un sprint
- `DELETE /sprints/:id` - Supprimer un sprint

### Time Tracking
- `GET /time-entries` - Lister les entrées de temps
- `POST /time-entries` - Créer une entrée de temps
- `PUT /time-entries/:id` - Mettre à jour une entrée
- `DELETE /time-entries/:id` - Supprimer une entrée
- `GET /time-entries/:taskId/summary` - Résumé du temps

### Templates
- `GET /templates` - Lister les modèles
- `POST /templates` - Créer un modèle
- `POST /templates/:id/use` - Utiliser un modèle
- `DELETE /templates/:id` - Supprimer un modèle

### Workflows
- `GET /workflows?projectId=:id` - Lister les flux
- `POST /workflows` - Créer un flux
- `PUT /workflows/:id` - Mettre à jour un flux
- `DELETE /workflows/:id` - Supprimer un flux
- `POST /workflows/init-project/:projectId` - Initialiser le flux

### Collaboration
- `POST /collaboration/mentions` - Créer une mention
- `POST /collaboration/watchers/:taskId` - Ajouter un observateur
- `GET /collaboration/watchers/:taskId` - Lister les observateurs
- `DELETE /collaboration/watchers/:taskId/:userId` - Retirer un observateur

### Teams
- `POST /teams/invite` - Inviter un membre
- `POST /teams/accept-invitation` - Accepter une invitation
- `POST /teams/project-role` - Assigner un rôle de projet
- `POST /teams/assign-multiple` - Assigner plusieurs membres

### Search
- `GET /search?q=:query` - Recherche globale

### Delegations
- `POST /delegations` - Déléguer une tâche
- `GET /delegations` - Lister les délégations

### Audit
- `GET /audit` - Lister les logs d'audit
- `GET /audit/project/:projectId` - Logs d'audit du projet

### Invitations
- `GET /invitations?workspaceId=:id` - Lister les invitations
- `POST /invitations` - Créer une invitation
- `PATCH /invitations/:id/accept` - Accepter une invitation
- `PATCH /invitations/:id/reject` - Rejeter une invitation
- `DELETE /invitations/:id` - Supprimer une invitation

## 🔐 Authentification

### Obtenir un Token
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "admin123"
  }'
```

Réponse :
```json
{
  "user": {
    "id": "user-id",
    "email": "admin@company.com",
    "name": "Super Admin",
    "role": "SUPER_ADMIN"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Utiliser le Token
```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🐳 Docker

### Build l'image
```bash
docker build -t daymark-api .
```

### Démarrer avec Docker Compose
```bash
docker-compose up
```

## 📊 Logs

Les logs sont affichés dans la console avec des codes couleur :
- 🟢 Requête réussie (2xx, 3xx)
- 🟡 Redirection (3xx)
- 🔴 Erreur (4xx, 5xx)

Exemple :
```
[14:30:45] 🟢 POST   /auth/login | 200 (45ms)
[14:30:46] 🟢 GET    /users | 200 (12ms)
[14:30:47] 🔴 GET    /users/invalid-id | 404 (5ms)
```

## 🔧 Commandes Utiles

### Générer le client Prisma
```bash
pnpm run db:generate
```

### Créer une migration
```bash
pnpm run db:migrate
```

### Déployer les migrations
```bash
pnpm run db:deploy
```

### Réinitialiser la base de données
```bash
pnpm run db:reset
```

### Seeder la base de données
```bash
pnpm run db:seed
```

### Linter le code
```bash
pnpm lint
```

### Formater le code
```bash
pnpm format
```

## 🐛 Dépannage

### Erreur de connexion à la base de données
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Vérifier que PostgreSQL est en cours d'exécution
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Démarrer le service PostgreSQL depuis les services Windows
```

### Erreur de migration
```
Error: P3005 - Database does not exist
```

**Solution**: Créer la base de données
```bash
pnpm run db:migrate
```

### Erreur de token JWT
```
Error: Invalid token
```

**Solution**: Vérifier que le token n'a pas expiré et qu'il est valide

### Port déjà utilisé
```
Error: listen EADDRINUSE :::3001
```

**Solution**: Changer le port dans `.env`
```env
PORT=3002
```

## 📚 Documentation Supplémentaire

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Guide complet de migration
- [NESTJS_MIGRATION_SUMMARY.md](./NESTJS_MIGRATION_SUMMARY.md) - Résumé de la migration
- [MIGRATION_EXAMPLE.md](./MIGRATION_EXAMPLE.md) - Exemple de migration d'un service
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Structure du projet
- [README.md](./README.md) - Documentation générale

## 🎯 Prochaines Étapes

1. ✅ Installation et configuration
2. ✅ Démarrage du serveur
3. 📋 Compléter la logique métier
4. 🧪 Ajouter les tests
5. 🚀 Déployer en production

## 💬 Support

Pour toute question ou problème :
1. Consulter la documentation NestJS
2. Vérifier les logs du serveur
3. Vérifier la configuration `.env`
4. Vérifier la connexion à la base de données

## ✨ Bon développement ! 🚀
