const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const l1Result = await prisma.student.updateMany({
    where: { gradeLevel: 'L1' },
    data: { gradeLevel: 'K1' }
  });

  const l2Result = await prisma.student.updateMany({
    where: { gradeLevel: 'L2' },
    data: { gradeLevel: 'K2' }
  });

  console.log(`Updated ${l1Result.count} students from L1 to K1.`);
  console.log(`Updated ${l2Result.count} students from L2 to K2.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
