const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.student.deleteMany({
    where: {
      OR: [
        { lastName: 'Test' },
        { lrn: { startsWith: 'LRN1000' } }
      ]
    }
  });

  console.log(`Deleted ${result.count} test students.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
