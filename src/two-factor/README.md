# 2FA Implementation - Backend

## 🔐 Fonctionnalités implémentées

### **Méthodes 2FA supportées**
- ✅ **TOTP** (Google Authenticator, Authy, etc.)
- ✅ **Email** (codes à 6 chiffres)
- ✅ **Codes de récupération** (8 codes de backup)

### **Endpoints API**

#### **Configuration 2FA**
```bash
# Obtenir le statut 2FA
GET /auth/2fa/status
Authorization: Bearer <token>

# Générer secret TOTP + QR code
POST /auth/2fa/totp/setup
Authorization: Bearer <token>

# Vérifier et activer TOTP
POST /auth/2fa/totp/verify-setup
Authorization: Bearer <token>
Body: { "token": "123456", "secret": "JBSWY3DPEHPK3PXP" }

# Activer 2FA par email
POST /auth/2fa/email/setup
Authorization: Bearer <token>

# Envoyer code email
POST /auth/2fa/email/send-code
Authorization: Bearer <token>
```

#### **Login avec 2FA**
```bash
# 1. Login classique
POST /auth/login
Body: { "email": "user@example.com", "password": "password" }
Response: { 
  "requiresTwoFactor": true,
  "availableMethods": ["TOTP", "EMAIL"],
  "tempToken": "temp_jwt_token",
  "userId": "user_id"
}

# 2. Envoyer code email (si méthode EMAIL)
POST /auth/login/2fa/send-code
Body: { "userId": "user_id", "method": "EMAIL" }

# 3. Vérifier code 2FA
POST /auth/login/2fa/verify
Body: { 
  "userId": "user_id", 
  "code": "123456", 
  "method": "TOTP",
  "isBackupCode": false 
}
Response: { 
  "user": { ... },
  "accessToken": "final_jwt_token"
}
```

#### **Gestion 2FA**
```bash
# Vérifier code (session active)
POST /auth/2fa/verify
Authorization: Bearer <token>
Body: { "code": "123456", "method": "TOTP" }

# Vérifier code de récupération
POST /auth/2fa/backup-code/verify
Authorization: Bearer <token>
Body: { "code": "A1B2C3D4" }

# Régénérer codes de récupération
POST /auth/2fa/backup-codes/regenerate
Authorization: Bearer <token>

# Désactiver 2FA
DELETE /auth/2fa/disable
Authorization: Bearer <token>
```

## 🗄️ Modifications base de données

### **Nouveaux champs User**
```prisma
model User {
  // ... champs existants
  twoFactorEnabled    Boolean @default(false)
  twoFactorMethods    TwoFactorMethod[] @default([])
  twoFactorSecret     String?
  backupCodes         String[] @default([])
  twoFactorVerifiedAt DateTime?
  twoFactorCodes      TwoFactorCode[]
}

enum TwoFactorMethod {
  TOTP
  EMAIL
}

model TwoFactorCode {
  id        String   @id @default(uuid())
  userId    String
  code      String
  method    TwoFactorMethod
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## 🔒 Sécurité

### **Tokens JWT**
- **Temp token** : `twoFactorVerified: false` (après login password)
- **Final token** : `twoFactorVerified: true` (après vérification 2FA)

### **Protection des routes**
```typescript
// Routes nécessitant 2FA complet
@UseGuards(JwtAuthGuard, TwoFactorGuard)

// Routes exemptées de 2FA (setup, login)
@SkipTwoFactor()
```

### **Codes de sécurité**
- **TOTP** : Window de 2 (±60 secondes)
- **Email** : Expiration 5 minutes
- **Backup codes** : Usage unique, supprimés après utilisation
- **Hachage** : bcrypt avec 10 rounds

## 📦 Dépendances ajoutées

```json
{
  "dependencies": {
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.4"
  },
  "devDependencies": {
    "@types/speakeasy": "^2.0.10",
    "@types/qrcode": "^1.5.6"
  }
}
```

## 🚀 Migration

```bash
# 1. Générer client Prisma
pnpm run db:generate

# 2. Créer migration
pnpm run db:migrate

# 3. Appliquer en production
pnpm run db:deploy
```

## ✅ Tests

### **Scénarios de test**
1. **Setup TOTP** : Génération QR + vérification
2. **Setup Email** : Activation + envoi code
3. **Login avec 2FA** : Flow complet
4. **Codes de récupération** : Utilisation + régénération
5. **Désactivation** : Nettoyage complet

### **Commandes test**
```bash
# Tests unitaires
npm test two-factor

# Tests e2e
npm run test:e2e auth
```

## 🔧 Configuration

### **Variables d'environnement**
```env
# JWT (existant)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Email (pour codes 2FA)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📋 TODO

- [ ] Service email pour envoi codes
- [ ] Rate limiting sur tentatives 2FA
- [ ] Audit logs pour actions 2FA
- [ ] Tests automatisés
- [ ] Documentation Swagger

## 🎯 Prochaines étapes

1. **Frontend** : Composants React pour setup/login 2FA
2. **Email service** : Intégration nodemailer
3. **Tests** : Couverture complète
4. **Monitoring** : Métriques et alertes 2FA