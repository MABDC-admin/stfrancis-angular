const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL.replace('&pgbouncer=true', '').replace('?pgbouncer=true', ''));
(async () => {
  const activeAy = await sql`SELECT id FROM "AcademicYear" WHERE "isActive" = true LIMIT 1`;
  const ayId = activeAy[0]?.id;
  console.log('activeAy', ayId);

  const dist = await sql`
    SELECT "section", "gradeLevel", COUNT(*)::int AS count
    FROM "Student"
    WHERE "academicYearId" = ${ayId}
    GROUP BY "section", "gradeLevel"
    ORDER BY "section", "gradeLevel"
  `;
  console.log('sections by section+grade', dist);

  const sectionNulls = await sql`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE "section" IS NULL OR TRIM("section") = '') AS blankOrNull
    FROM "Student"
    WHERE "academicYearId" = ${ayId}
  `;
  console.log('section coverage', sectionNulls);
})();
