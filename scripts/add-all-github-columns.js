import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function addAllGitHubColumns() {
  try {
    console.log('Adding GitHub columns to User table...');
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "githubToken" TEXT,
      ADD COLUMN IF NOT EXISTS "githubUsername" TEXT,
      ADD COLUMN IF NOT EXISTS "githubData" JSONB;
    `;
    
    console.log('Adding GitHub columns to Project table...');
    await prisma.$executeRaw`
      ALTER TABLE "Project" 
      ADD COLUMN IF NOT EXISTS "githubRepo" TEXT,
      ADD COLUMN IF NOT EXISTS "githubData" JSONB;
    `;
    
    console.log('✅ All GitHub columns added successfully');
  } catch (error) {
    console.error('❌ Error adding GitHub columns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAllGitHubColumns();