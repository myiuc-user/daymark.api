#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const runCommand = (command, description) => {
  console.log(`🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
};

const main = () => {
  console.log('🚀 Starting database synchronization...\n');

  // Check if schema exists
  if (!existsSync('prisma/schema.prisma')) {
    console.error('❌ Prisma schema not found!');
    process.exit(1);
  }

  // Push schema changes to database (creates tables, adds columns, etc.)
  runCommand('npx prisma db push --accept-data-loss', 'Syncing database schema');

  // Generate Prisma client
  runCommand('npx prisma generate', 'Generating Prisma client');

  console.log('🎉 Database synchronization completed successfully!');
  console.log('📝 Your database is now up to date with your schema.');
};

main();