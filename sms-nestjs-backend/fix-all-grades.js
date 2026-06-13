const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany();
  for (const s of students) {
    let newGrade = s.gradeLevel;
    if (newGrade.startsWith('Grade ')) {
      newGrade = newGrade.replace('Grade ', 'G');
    } else if (newGrade === 'Kindergarten 1' || newGrade === 'Pre-Kindergarten') {
      newGrade = 'K1';
    } else if (newGrade === 'Kindergarten 2' || newGrade === 'Kindergarten') {
      newGrade = 'K2';
    }
    if (newGrade !== s.gradeLevel) {
      await prisma.student.update({
        where: { id: s.id },
        data: { gradeLevel: newGrade }
      });
    }
  }

  const apps = await prisma.enrollmentApplication.findMany();
  for (const a of apps) {
    let newGrade = a.gradeLevel;
    if (newGrade.startsWith('Grade ')) {
      newGrade = newGrade.replace('Grade ', 'G');
    } else if (newGrade === 'Kindergarten 1' || newGrade === 'Pre-Kindergarten') {
      newGrade = 'K1';
    } else if (newGrade === 'Kindergarten 2' || newGrade === 'Kindergarten') {
      newGrade = 'K2';
    }
    if (newGrade !== a.gradeLevel) {
      await prisma.enrollmentApplication.update({
        where: { id: a.id },
        data: { gradeLevel: newGrade }
      });
    }
  }

  console.log('Fixed all grade levels in DB');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
