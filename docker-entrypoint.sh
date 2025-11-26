#!/bin/sh

echo "Running migrations..."
npm run db:migrate || true

echo "Starting application..."
npm start
