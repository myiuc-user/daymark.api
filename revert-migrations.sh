#!/bin/bash

# Script pour revert les migrations échouées en production

echo "🔄 Revert des migrations échouées..."

# 1. Marquer les migrations échouées comme rolled-back
echo "Marquage des migrations comme rolled-back..."
docker exec -it daymark-api pnpm prisma migrate resolve --rolled-back 20251223153430_add_scheduled_reports || true
docker exec -it daymark-api pnpm prisma migrate resolve --rolled-back 20251223154500_add_scheduled_reports_fix || true

# 2. Supprimer manuellement les tables si elles existent
echo "Suppression des tables créées..."
docker exec -it daymark-api psql $DATABASE_URL -c "
DROP TABLE IF EXISTS \"ReportExecution\" CASCADE;
DROP TABLE IF EXISTS \"ScheduledReport\" CASCADE;
DROP TYPE IF EXISTS \"ReportType\" CASCADE;
DROP TYPE IF EXISTS \"ExecutionStatus\" CASCADE;
" || true

# 3. Nettoyer la table _prisma_migrations
echo "Nettoyage de la table des migrations..."
docker exec -it daymark-api psql $DATABASE_URL -c "
DELETE FROM \"_prisma_migrations\" 
WHERE migration_name IN (
  '20251223153430_add_scheduled_reports',
  '20251223154500_add_scheduled_reports_fix'
);
" || true

# 4. Vérifier le statut
echo "Vérification du statut..."
docker exec -it daymark-api pnpm prisma migrate status

echo "✅ Revert terminé"