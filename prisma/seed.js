import prisma from './config/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  const adminEmail = process.env.ROOT_ADMIN_EMAIL || 'admin@company.com';
  const adminPassword = process.env.ROOT_ADMIN_PASSWORD || 'admin123';

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN'
      }
    });

    console.log('✅ Super admin user created:', admin.email);
  } else {
    console.log('ℹ️ Super admin user already exists:', existingAdmin.email);
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