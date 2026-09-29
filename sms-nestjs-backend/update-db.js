const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating Teacher Profiles to Grade 1...");
  await prisma.teacherProfile.updateMany({
    data: { assignedGradeLevel: "Grade 1" }
  });
  
  console.log("Updating Students to Grade 1...");
  await prisma.student.updateMany({
    data: { gradeLevel: "Grade 1" }
  });

  console.log("Database updated successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
