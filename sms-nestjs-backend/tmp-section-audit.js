const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL.replace('&pgbouncer=true', '').replace('?pgbouncer=true', ''));
(async () => {
  const [ay] = await sql`SELECT id FROM "AcademicYear" WHERE "isActive" = true LIMIT 1`;
  const rows = await sql.query(`SELECT "gradeLevel", "sectionName", capacity, enrolled, "availableSlots", status, id FROM "Section" WHERE "academicYearId" = $1 ORDER BY "gradeLevel", "sectionName"`, [ay.id]);
  console.log('rows', rows.rows);
})();
