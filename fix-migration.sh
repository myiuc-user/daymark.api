#!/bin/bash

# Script pour résoudre les migrations échouées

echo "🔧 Résolution des migrations échouées..."

# 1. Marquer la migration échouée comme résolue
echo "Marquage de la migration échouée comme résolue..."
docker exec -it daymark-api pnpm prisma migrate resolve --applied 20251223154500_add_scheduled_reports_fix

# 2. Vérifier le statut des migrations
echo "Vérification du statut..."
docker exec -it daymark-api pnpm prisma migrate status

# 3. Appliquer les migrations restantes
echo "Application des migrations..."
docker exec -it daymark-api pnpm run db:deploy

echo "✅ Migrations résolues"