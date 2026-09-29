const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    include: { teacherProfile: true, teacherClasses: true }
  });
  console.log(JSON.stringify(users, null, 2));
}
main().finally(() => prisma.$disconnect());
