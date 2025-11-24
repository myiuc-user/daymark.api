import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function addGitHubColumns() {
  try {
    console.log('Adding GitHub columns to User table...');
    
    // Add columns using raw SQL
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "githubToken" TEXT,
      ADD COLUMN IF NOT EXISTS "githubUsername" TEXT,
      ADD COLUMN IF NOT EXISTS "githubData" JSONB;
    `;
    
    console.log('✅ GitHub columns added successfully');
  } catch (error) {
    console.error('❌ Error adding GitHub columns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addGitHubColumns();