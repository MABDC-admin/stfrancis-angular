const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.enrollmentApplication.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.documentRequirement.deleteMany({});
  await prisma.academicRecord.deleteMany({});
  await prisma.learnerMovement.deleteMany({});
  await prisma.documentRequest.deleteMany({});
  await prisma.idQrRecord.deleteMany({});
  
  console.log("Successfully purged all student and application data.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
