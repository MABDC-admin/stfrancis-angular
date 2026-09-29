import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({ take: 20 });
  
  if (students.length === 0) {
    console.log('No students found to seed.');
    return;
  }

  console.log(`Seeding academic profile data for ${students.length} students...`);

  for (const student of students) {
    // 1. Seed Core Values (Maka-Diyos, Makatao, Makakalikasan, Makabansa)
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const marks = ['AO', 'SO', 'RO', 'NO'];
    
    for (const q of quarters) {
      await prisma.studentCoreValues.upsert({
        where: {
          studentId_schoolYear_quarter: {
            studentId: student.id,
            schoolYear: '2025-2026',
            quarter: q,
          }
        },
        create: {
          studentId: student.id,
          schoolYear: '2025-2026',
          quarter: q,
          makaDiyos: marks[Math.floor(Math.random() * 2)], // mostly AO or SO
          makatao: marks[Math.floor(Math.random() * 2)],
          makakalikasan: marks[Math.floor(Math.random() * 3)],
          makabansa: marks[Math.floor(Math.random() * 2)],
        },
        update: {}
      });
    }

    // 2. Seed Health Profile (BoSY and EoSY)
    const records = ['BoSY', 'EoSY'];
    for (const r of records) {
      const height = 1.4 + Math.random() * 0.4; // 1.4m to 1.8m
      const weight = 40 + Math.random() * 40; // 40kg to 80kg
      const bmi = weight / (height * height);
      let category = 'Normal';
      if (bmi < 16) category = 'Severely Wasted';
      else if (bmi < 18.5) category = 'Wasted';
      else if (bmi >= 25 && bmi < 30) category = 'Overweight';
      else if (bmi >= 30) category = 'Obese';

      await prisma.studentHealthProfile.upsert({
        where: {
          studentId_schoolYear_recordType: {
            studentId: student.id,
            schoolYear: '2025-2026',
            recordType: r,
          }
        },
        create: {
          studentId: student.id,
          schoolYear: '2025-2026',
          recordType: r,
          heightMeters: parseFloat(height.toFixed(2)),
          weightKg: parseFloat(weight.toFixed(1)),
          bmi: parseFloat(bmi.toFixed(1)),
          bmiCategory: category,
        },
        update: {}
      });
    }

    // 3. Seed Academic History (Previous Grades)
    // Create random history based on their current grade
    const currentGradeNum = parseInt(student.gradeLevel.replace(/\D/g, '')) || 7;
    for (let i = 1; i < currentGradeNum; i++) {
      const pastGrade = `Grade ${i}`;
      const pastYear = `${2025 - (currentGradeNum - i)}-${2026 - (currentGradeNum - i)}`;
      const avg = (80 + Math.random() * 15).toFixed(0);
      
      const existing = await prisma.academicRecord.findFirst({
        where: { studentId: student.id, gradeLevel: pastGrade, schoolYear: pastYear }
      });
      
      if (!existing) {
        await prisma.academicRecord.create({
          data: {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            gradeLevel: pastGrade,
            schoolYear: pastYear,
            generalAverage: avg,
            status: 'Promoted',
            remarks: 'Eligible for admission to next grade',
            section: 'A',
          }
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
