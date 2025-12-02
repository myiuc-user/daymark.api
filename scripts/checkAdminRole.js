import prisma from '../src/config/prisma.js';

async function checkAdminRole() {
  try {
    const adminEmail = process.env.ROOT_ADMIN_EMAIL || 'admin@company.com';
    
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Admin user details:');
    console.log('  ID:', admin.id);
    console.log('  Email:', admin.email);
    console.log('  Name:', admin.name);
    console.log('  Role:', admin.role);
    console.log('  Active:', admin.isActive);

    if (admin.role !== 'SUPER_ADMIN') {
      console.log('⚠️  WARNING: Admin role is not SUPER_ADMIN!');
      console.log('🔧 Fixing admin role...');
      
      const updatedAdmin = await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'SUPER_ADMIN' },
        select: { id: true, email: true, role: true }
      });
      
      console.log('✅ Admin role updated to:', updatedAdmin.role);
    } else {
      console.log('✅ Admin role is correct');
    }

  } catch (error) {
    console.error('❌ Error checking admin role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminRole();