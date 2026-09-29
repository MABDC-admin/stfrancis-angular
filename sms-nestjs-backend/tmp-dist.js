const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL.replace('&pgbouncer=true', '').replace('?pgbouncer=true', ''));
(async () => {
  const ay = await sql`SELECT id FROM "AcademicYear" WHERE "isActive" = true LIMIT 1`;
  const ayId = ay[0]?.id;
  const sectionGrades = await sql`SELECT DISTINCT "gradeLevel" FROM "Section" WHERE "academicYearId" = ${ayId} ORDER BY "gradeLevel"`;
  const studentGrades = await sql`SELECT DISTINCT "gradeLevel" FROM "Student" WHERE "academicYearId" = ${ayId} ORDER BY "gradeLevel"`;
  console.log('section grades', sectionGrades);
  console.log('student grades', studentGrades);
})();
