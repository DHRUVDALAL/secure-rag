import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo company
  const company = await prisma.company.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      domain: 'acme.com',
      plan: 'enterprise',
    },
  });

  console.log(`✅ Company created: ${company.name}`);

  // Create demo users
  const passwordHash = await bcrypt.hash('password123', 12);

  const users = [
    { email: 'admin@acme.com', firstName: 'Alice', lastName: 'Admin', role: 'ADMIN' as UserRole },
    { email: 'manager@acme.com', firstName: 'Bob', lastName: 'Manager', role: 'MANAGER' as UserRole },
    { email: 'employee@acme.com', firstName: 'Charlie', lastName: 'Employee', role: 'EMPLOYEE' as UserRole },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email_companyId: { email: userData.email, companyId: company.id } },
      update: {},
      create: {
        ...userData,
        passwordHash,
        companyId: company.id,
      },
    });
    console.log(`✅ User created: ${user.email} (${user.role})`);
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
