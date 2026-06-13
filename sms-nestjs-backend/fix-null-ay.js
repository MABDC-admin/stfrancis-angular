const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ay = await prisma.academicYear.findFirst({
    where: { code: 'SY2025-2026' }
  });

  if (!ay) {
    console.log('SY2025-2026 not found');
    return;
  }

  const sResult = await prisma.student.updateMany({
    where: { academicYearId: null },
    data: { academicYearId: ay.id }
  });

  const eaResult = await prisma.enrollmentApplication.updateMany({
    where: { academicYearId: null },
    data: { academicYearId: ay.id }
  });

  console.log(`Linked ${sResult.count} stray students to SY2025-2026.`);
  console.log(`Linked ${eaResult.count} stray applications to SY2025-2026.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
