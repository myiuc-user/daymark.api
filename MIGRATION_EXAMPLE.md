# 📚 Exemple de Migration Complète d'un Service

## Cas d'Étude: Service Utilisateur

### Avant (Express)

**src/services/userService.js**
```javascript
import prisma from '../config/prisma.js';

export const userService = {
  async getAllUsers() {
    return await prisma.user.findMany();
  },

  async getUserById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true
      }
    });
  },

  async updateUser(id, data) {
    return await prisma.user.update({
      where: { id },
      data
    });
  },

  async deleteUser(id) {
    return await prisma.user.delete({
      where: { id }
    });
  }
};
```

**src/controllers/userController.js**
```javascript
import { userService } from '../services/userService.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const userController = {
  getAllUsers: asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();
    res.json({ users });
  }),

  getUserById: asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    res.json({ user });
  }),

  updateUser: asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ user });
  }),

  deleteUser: asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.json({ message: 'User deleted' });
  })
};
```

**src/routes/userRoutes.js**
```javascript
import express from 'express';
import { userController } from '../controllers/userController.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, userController.getAllUsers);
router.get('/:id', authenticateToken, userController.getUserById);
router.put('/:id', authenticateToken, userController.updateUser);
router.delete('/:id', authenticateToken, requireSuperAdmin, userController.deleteUser);

export default router;
```

---

### Après (NestJS)

**src/users/dto/update-user.dto.ts**
```typescript
import { z } from 'zod';

export const UpdateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  image: z.string().optional()
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
```

**src/users/users.service.ts**
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true
      }
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id }
    });
  }
}
```

**src/users/users.controller.ts**
```typescript
import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UsePipes
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateUserSchema, UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Put(':id')
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.updateUser(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
```

**src/users/users.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}
```

---

## 🔄 Différences Clés

| Aspect | Express | NestJS |
|--------|---------|--------|
| **Gestion d'erreurs** | try-catch + AppError | Exceptions NestJS |
| **Validation** | Manuelle | Pipes + Zod |
| **Authentification** | Middleware | Guards |
| **Autorisation** | Middleware | Guards + Décorateurs |
| **Injection de dépendances** | Manuelle | Automatique |
| **Structure** | Plate | Modulaire |
| **Réutilisabilité** | Faible | Haute |

---

## 📋 Checklist de Migration pour Chaque Service

Pour migrer un service, suivez ces étapes :

### 1. Créer les DTOs
```typescript
// src/[module]/dto/create-[entity].dto.ts
// src/[module]/dto/update-[entity].dto.ts
```

### 2. Créer le Service
```typescript
// src/[module]/[module].service.ts
// Copier la logique du fichier Express
// Adapter les appels Prisma
// Utiliser les exceptions NestJS
```

### 3. Créer le Contrôleur
```typescript
// src/[module]/[module].controller.ts
// Mapper les routes Express aux méthodes NestJS
// Ajouter les guards et décorateurs
// Utiliser les pipes de validation
```

### 4. Mettre à Jour le Module
```typescript
// src/[module]/[module].module.ts
// Importer les dépendances
// Exporter le service si nécessaire
```

### 5. Tester
```bash
pnpm test
```

---

## 🎯 Ordre de Migration Recommandé

1. **Auth** ✅ (Déjà fait)
2. **Users** (Exemple ci-dessus)
3. **Workspaces**
4. **Projects**
5. **Tasks**
6. **Comments**
7. **Admin**
8. **Files**
9. **Notifications**
10. **Analytics**
11. **GitHub**
12. **Milestones**
13. **Sprints**
14. **TimeTracking**
15. **Templates**
16. **Workflows**
17. **Collaboration**
18. **Teams**
19. **Search**
20. **Delegations**
21. **Audit**
22. **Invitations**

---

## 💡 Conseils

1. **Préserver la logique métier**: Ne pas simplifier ou modifier la logique
2. **Tester chaque service**: Vérifier que les endpoints fonctionnent
3. **Utiliser les types TypeScript**: Profiter de la sécurité des types
4. **Documenter les changements**: Garder une trace des modifications
5. **Valider les données**: Utiliser Zod pour toutes les entrées

---

## 🚀 Résultat Final

Après migration complète, vous aurez :
- ✅ Architecture modulaire et scalable
- ✅ Meilleure maintenabilité
- ✅ Sécurité des types avec TypeScript
- ✅ Validation automatique des données
- ✅ Gestion centralisée des erreurs
- ✅ Injection de dépendances
- ✅ Tous les endpoints fonctionnels
- ✅ Toute la logique métier préservée
