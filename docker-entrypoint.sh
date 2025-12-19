#!/bin/sh

echo "Running migrations..."
npm run db:deploy || true

echo "Running seed..."
npm run db:seed || true

echo "Starting application..."
npm start
