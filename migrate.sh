#!/bin/bash

# Script pour appliquer les migrations sur le serveur

echo "🔄 Application des migrations..."

# Se connecter au container et exécuter les migrations
docker exec -it daymark-api pnpm run db:deploy

# Ou si le container n'est pas en cours d'exécution
# docker run --rm --env-file .env daymark-api pnpm run db:deploy

echo "✅ Migrations appliquées"