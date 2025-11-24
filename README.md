# Project Management Backend

Backend API pour le système de gestion de projet.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL
- npm ou yarn

### Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Modifier .env avec vos paramètres
```

3. **Configurer la base de données**
```bash
# Générer le client Prisma
npm run db:generate

# Exécuter les migrations
npm run db:migrate
```

4. **Démarrer le serveur**
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 🔐 Compte Admin par Défaut

Au premier démarrage, un compte super admin est créé automatiquement :
- **Email :** admin@company.com
- **Mot de passe :** admin123

⚠️ **Important :** Changez ces identifiants en production !

## 📡 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur
- `POST /api/auth/logout` - Déconnexion

### Administration (Super Admin uniquement)
- `GET /api/admin/users` - Liste des utilisateurs
- `POST /api/admin/users` - Créer un utilisateur
- `PUT /api/admin/users/:id/role` - Modifier le rôle
- `PUT /api/admin/users/:id/status` - Activer/Désactiver
- `DELETE /api/admin/users/:id` - Supprimer utilisateur

### Workspaces
- `GET /api/workspaces` - Liste des workspaces
- `POST /api/workspaces` - Créer workspace
- `GET /api/workspaces/:id` - Détails workspace
- `PUT /api/workspaces/:id` - Modifier workspace
- `DELETE /api/workspaces/:id` - Supprimer workspace

### Projets
- `GET /api/projects?workspaceId=:id` - Liste des projets
- `POST /api/projects` - Créer projet
- `GET /api/projects/:id` - Détails projet
- `PUT /api/projects/:id` - Modifier projet
- `DELETE /api/projects/:id` - Supprimer projet

### Tâches
- `GET /api/tasks?projectId=:id` - Liste des tâches
- `POST /api/tasks` - Créer tâche
- `GET /api/tasks/:id` - Détails tâche
- `PUT /api/tasks/:id` - Modifier tâche
- `DELETE /api/tasks/:id` - Supprimer tâche
- `POST /api/tasks/:id/comments` - Ajouter commentaire

### Utilisateurs
- `GET /api/users/search?q=:query` - Rechercher utilisateurs
- `GET /api/users/:id` - Profil utilisateur

## 🔒 Authentification

L'API utilise JWT avec deux tokens :
- **Access Token :** 15 minutes (en-tête Authorization)
- **Refresh Token :** 7 jours (cookie httpOnly)

### Headers requis
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 🏗️ Structure du Projet

```
src/
├── controllers/     # Logique métier (non utilisé actuellement)
├── middleware/      # Middlewares (auth, validation)
├── routes/          # Définition des routes
├── services/        # Services (auth, etc.)
├── utils/           # Utilitaires (validation)
└── app.js           # Configuration Express
```

## 🗄️ Base de Données

### Modèles Principaux
- **User :** Utilisateurs avec rôles (SUPER_ADMIN, ADMIN, MEMBER)
- **Workspace :** Espaces de travail
- **Project :** Projets dans les workspaces
- **Task :** Tâches assignées aux utilisateurs
- **Comment :** Commentaires sur les tâches

### Commandes Prisma
```bash
# Générer le client
npm run db:generate

# Créer une migration
npm run db:migrate

# Réinitialiser la DB
npm run db:reset

# Seed (si configuré)
npm run db:seed
```

## 🔧 Variables d'Environnement

```env
DATABASE_URL=postgresql://user:password@localhost:5432/project_management
DIRECT_URL=postgresql://user:password@localhost:5432/project_management
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
ROOT_ADMIN_EMAIL=admin@company.com
ROOT_ADMIN_PASSWORD=admin123
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## 🚨 Sécurité

- Mots de passe hashés avec bcrypt (12 rounds)
- JWT avec expiration courte
- Validation des données avec Zod
- CORS configuré
- Helmet pour les headers de sécurité
- Cookies httpOnly pour refresh tokens

## 📝 Développement

### Démarrer en mode dev
```bash
npm run dev
```

### Tests (à implémenter)
```bash
npm test
```

### Linting (à configurer)
```bash
npm run lint
```

## 🚀 Déploiement

1. **Variables d'environnement de production**
2. **Base de données PostgreSQL**
3. **Exécuter les migrations**
4. **Démarrer avec `npm start`**

## 📞 Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe de développement.