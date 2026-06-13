const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ays = await prisma.academicYear.findMany();
  console.log('Found ' + ays.length + ' academic years');
  if (ays.length === 0) {
    await prisma.academicYear.create({
      data: {
        code: 'SY2026-2027',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isActive: true
      }
    });
    console.log('Created SY2026-2027');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
