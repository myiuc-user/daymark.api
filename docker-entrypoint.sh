#!/bin/sh

set -e

echo "Running migrations..."
npm run db:migrate

echo "Starting application..."
node app.js
