const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  console.log("Found teacher:", teacher);
}
main().catch(console.error).finally(() => prisma.$disconnect());
