const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const profiles = await prisma.teacherProfile.findMany();
  console.log("Teacher Profiles:", JSON.stringify(profiles, null, 2));
  const classes = await prisma.teacherClassAssignment.findMany({ include: { section: true } });
  console.log("Classes:", JSON.stringify(classes, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
