const { neon } = require('@neondatabase/serverless');

const rawUrl = process.env.DATABASE_URL;
const sql = neon(rawUrl.replace('&pgbouncer=true', '').replace('?pgbouncer=true', ''));

(async () => {
  const activeAy = await sql`SELECT id FROM "AcademicYear" WHERE "isActive" = true LIMIT 1`;
  const ayId = activeAy[0]?.id;
  console.log('ayId', ayId);

  const rows = await sql`
    SELECT s."gradeLevel" AS section_grade,
           s."sectionName",
           COALESCE(SUM(CASE WHEN LOWER(TRIM(st."gradeLevel")) IN ('nursery','kindergarten','kindergarten 1','k1','kinder') THEN
             CASE WHEN LOWER(s."gradeLevel") = 'nursery' THEN 1 ELSE 0 END
             WHEN LOWER(TRIM(st."gradeLevel")) IN ('kindergarten 2','k2') THEN
               CASE WHEN LOWER(s."gradeLevel") = 'k2' THEN 1 ELSE 0 END
             WHEN LOWER(TRIM(st."gradeLevel")) IN ('grade 1','g1') THEN CASE WHEN LOWER(s."gradeLevel") IN ('g1') THEN 1 ELSE 0 END
             WHEN LOWER(TRIM(st."gradeLevel")) IN ('grade 2','g2') THEN CASE WHEN LOWER(s."gradeLevel") IN ('g2') THEN 1 ELSE 0 END
             WHEN LOWER(TRIM(st."gradeLevel")) IN ('grade 3','g3') THEN CASE WHEN LOWER(s."gradeLevel") IN ('g3') THEN 1 ELSE 0 END
             WHEN LOWER(TRIM(st."gradeLevel")) IN ('grade 4','g4') THEN CASE WHEN LOWER(s."gradeLevel") IN ('g4') THEN 1 ELSE 0 END
             WHEN LOWER(TRIM(st."gradeLevel")) IN ('grade 5','g5') THEN CASE WHEN LOWER(s."gradeLevel") IN ('g5') THEN 1 ELSE 0 END
             WHEN LOWER(TRIM(st."gradeLevel")) IN ('grade 6','g6') THEN CASE WHEN LOWER(s."gradeLevel") IN ('g6') THEN 1 ELSE 0 END
             ELSE 0 END) AS matched
    FROM "Section" s
    LEFT JOIN "Student" st
      ON (st.section = s."sectionName")
     AND st."academicYearId" = s."academicYearId"
    WHERE s."academicYearId" = ${ayId}
    GROUP BY s.id, s."gradeLevel", s."sectionName"
    ORDER BY s."gradeLevel", s."sectionName"`;

  console.log(rows);
})();
