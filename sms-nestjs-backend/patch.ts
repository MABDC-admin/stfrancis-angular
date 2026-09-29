import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'jbriones.13579@gmail.com' } });
  if (!user) return;

  const subjects = [
    'Socio-Emotional Development',
    'Values Development (GMRC)',
    'Cognitive Development',
    'Physical Health and Motor Development',
    'Aesthetic/Creative Development',
    'Literacy, Language, and Communication'
  ];

  await prisma.teacherProfile.update({
    where: { teacherUserId: user.id },
    data: {
      subjects: subjects.join('|'),
      totalClassesHandled: subjects.length
    }
  });

  await prisma.teacherClassAssignment.deleteMany({ where: { teacherUserId: user.id } });

  const assignments = subjects.map(subject => ({
    teacherUserId: user.id,
    sectionName: 'Nursery',
    subject,
    schedule: 'TBA',
    room: ''
  }));

  await prisma.teacherClassAssignment.createMany({ data: assignments });
  console.log('Successfully patched J Briones with Nursery curriculum.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
