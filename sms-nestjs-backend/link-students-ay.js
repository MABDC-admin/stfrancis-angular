const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching SY2025-2026...');
  const ay = await prisma.academicYear.findUnique({
    where: { code: 'SY2025-2026' }
  });

  if (!ay) {
    console.error('Could not find SY2025-2026 academic year.');
    return;
  }

  console.log(`Found AY: ${ay.id}`);

  // Get all students where academicYearId is null
  const students = await prisma.student.findMany({
    where: { academicYearId: null }
  });

  console.log(`Found ${students.length} students without an academic year.`);

  if (students.length > 0) {
    console.log('Updating students...');
    const result = await prisma.student.updateMany({
      where: { academicYearId: null },
      data: { academicYearId: ay.id }
    });
    console.log(`Successfully linked ${result.count} students to SY2025-2026!`);
  } else {
    console.log('All students already have an academic year.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
