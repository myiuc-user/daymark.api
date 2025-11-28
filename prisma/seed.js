import prisma from '../src/config/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  const adminEmail = process.env.ROOT_ADMIN_EMAIL || 'admin@company.com';
  const adminPassword = process.env.ROOT_ADMIN_PASSWORD || 'admin123';

  // Check if admin user already exists
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN'
      }
    });

    console.log('✅ Super admin user created:', admin.email);
  } else {
    console.log('ℹ️ Super admin user already exists:', admin.email);
  }

  // Create a workspace if it doesn't exist
  let workspace = await prisma.workspace.findFirst({
    where: { ownerId: admin.id }
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: 'Default Workspace',
        slug: 'default-workspace',
        ownerId: admin.id
      }
    });
    console.log('✅ Workspace created:', workspace.name);
  } else {
    console.log('ℹ️ Workspace already exists:', workspace.name);
  }

  // Create a project if it doesn't exist
  let project = await prisma.project.findFirst({
    where: { workspaceId: workspace.id }
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Sample Project',
        description: 'A sample project for testing',
        workspaceId: workspace.id,
        team_lead: admin.id,
        status: 'ACTIVE',
        priority: 'MEDIUM'
      }
    });
    console.log('✅ Project created:', project.name);
  } else {
    console.log('ℹ️ Project already exists:', project.name);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
