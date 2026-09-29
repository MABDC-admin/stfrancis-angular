const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL.replace('&pgbouncer=true', '').replace('?pgbouncer=true', ''));
(async () => {
  const [ay] = await sql`SELECT id FROM "AcademicYear" WHERE "isActive" = true LIMIT 1`;
  const rows = await sql`SELECT "gradeLevel", "enrollmentStatus", COUNT(*)::int AS count FROM "Student" WHERE "academicYearId" = ${ay.id} GROUP BY "gradeLevel", "enrollmentStatus" ORDER BY "gradeLevel", "enrollmentStatus"`;
  console.log(rows);
})();
