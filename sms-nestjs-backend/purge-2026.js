const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ay = await prisma.academicYear.findUnique({ where: { code: 'AY-2026' } });
  if (!ay) {
    console.log("No 2026 AY found!");
    return;
  }

  const ayId = ay.id;

  await prisma.enrollmentApplication.deleteMany({ where: { academicYearId: ayId } });
  await prisma.student.deleteMany({ where: { academicYearId: ayId } });
  await prisma.documentRequirement.deleteMany({ where: { academicYearId: ayId } });
  await prisma.academicRecord.deleteMany({ where: { academicYearId: ayId } });
  await prisma.learnerMovement.deleteMany({ where: { academicYearId: ayId } });
  await prisma.documentRequest.deleteMany({ where: { academicYearId: ayId } });
  await prisma.idQrRecord.deleteMany({ where: { academicYearId: ayId } });
  
  console.log("Successfully purged all student data for AY-2026.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
