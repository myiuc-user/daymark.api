#!/bin/sh

echo "Running migrations..."
pnpm run db:deploy || true

echo "Running seed..."
pnpm run db:seed || true

echo "Starting application..."
pnpm start
