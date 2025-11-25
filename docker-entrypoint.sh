#!/bin/sh

set -e

echo "Running database migrations..."
pnpm prisma db push

echo "Starting application..."
node src/app.js
