# Script d'importation Projet 1

Ce script permet d'importer automatiquement les 12 initiatives du Projet 1 dans Daymark.

## 📋 Prérequis

1. Base de données PostgreSQL configurée
2. Compte super admin créé
3. Variables d'environnement configurées dans `.env`

## 🚀 Utilisation

### 1. Compiler le script TypeScript

```bash
cd daymark.api
pnpm install
npx tsx scripts/import-projet1.ts
```

### 2. Vérifier l'importation

Connectez-vous à Daymark et vérifiez :
- Le workspace "Projet 1 - Restructuration Gouvernance IUC" est créé
- Les projets P1-I1 et P1-I2 sont présents (+ les autres après ajout)
- Les tâches et milestones sont générés

## 📝 Structure importée

Pour chaque initiative, le script crée :

- **1 Projet** avec les métadonnées (nom, description, budget, période)
- **N Tâches** basées sur les objectifs
- **M Tâches** basées sur les livrables
- **X Milestones** basées sur les phases

## ⚙️ Personnalisation

### Ajouter les 10 autres initiatives

Éditez `import-projet1.ts` et ajoutez les initiatives P1-I3 à P1-I12 dans le tableau `initiatives[]` en suivant le même format.

### Modifier les dates

Les dates sont actuellement génériques (2026). Vous pouvez les parser depuis le document ou les ajuster manuellement après importation.

### Assigner les responsables

Après importation, invitez les membres et assignez-les aux projets via l'interface Daymark.

## 🔧 Dépannage

**Erreur "Aucun super admin trouvé"**
- Lancez d'abord `pnpm run db:seed` pour créer le compte admin par défaut

**Erreur de connexion base de données**
- Vérifiez votre `DATABASE_URL` dans `.env`
- Assurez-vous que PostgreSQL est démarré

**Doublons lors de réexécution**
- Le script ne vérifie pas les doublons actuellement
- Supprimez le workspace manuellement avant de relancer

## 📊 Données importées

- ✅ P1-I1: Transformation juridique en SAS (23,65M FCFA)
- ✅ P1-I2: Identification membres CA et Comités (33,55M FCFA)
- ✅ P1-I3: Calendrier annuel CA et Comités (5M FCFA)
- ✅ P1-I4: Cartographie processus opérationnels (45M FCFA)
- ✅ P1-I5: Refonte processus internes (55M FCFA)
- ✅ P1-I6: Renforcement équipe de direction (120M FCFA)
- ✅ P1-I7: Management de la performance RH (35M FCFA)
- ✅ P1-I8: Évaluation continue qualité services (25M FCFA)
- ✅ P1-I9: Structures lean, agiles et robustes (40M FCFA)
- ✅ P1-I10: GPEC - Gestion Prévisionnelle Emplois (30M FCFA)
- ✅ P1-I11: Gestion budgétaire - Phase 1 (35M FCFA)
- ✅ P1-I12: Gestion budgétaire - Phase 2 (25M FCFA)

**Budget total: 472,2M FCFA**

## 🎯 Prochaines améliorations

- [ ] Parser automatiquement le fichier projet1.txt
- [ ] Gérer les doublons (vérification avant création)
- [ ] Parser les dates exactes depuis les périodes
- [ ] Créer automatiquement les utilisateurs responsables
- [ ] Importer les risques et parties prenantes
- [ ] Générer un rapport d'importation détaillé
- [ ] Ajouter les story points basés sur les budgets
- [ ] Créer des sprints basés sur les phases
