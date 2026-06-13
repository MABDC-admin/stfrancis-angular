const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.student.updateMany({
    where: { gradeLevel: 'Grade 6' },
    data: { gradeLevel: 'G6' }
  });
  await prisma.enrollmentApplication.updateMany({
    where: { gradeLevel: 'Grade 6' },
    data: { gradeLevel: 'G6' }
  });

  await prisma.student.updateMany({
    where: { gradeLevel: 'Grade 7' },
    data: { gradeLevel: 'G7' }
  });
  await prisma.enrollmentApplication.updateMany({
    where: { gradeLevel: 'Grade 7' },
    data: { gradeLevel: 'G7' }
  });
  console.log('Fixed grade levels in DB');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
