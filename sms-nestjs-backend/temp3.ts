const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sections = await prisma.section.findMany({});
  console.log(JSON.stringify(sections, null, 2));
}
main().finally(() => prisma.$disconnect());
