const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const students = await prisma.student.findMany({
    select: { studentNo: true, gradeLevel: true, section: true }
  });
  console.log(JSON.stringify(students, null, 2));
}
main().finally(() => prisma.$disconnect());
