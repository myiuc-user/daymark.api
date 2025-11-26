#!/bin/sh

echo "Running migrations..."
npm run db:deploy || true

echo "Starting application..."
npm start
