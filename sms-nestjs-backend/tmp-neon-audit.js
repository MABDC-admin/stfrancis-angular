const { neon } = require('@neondatabase/serverless');
const databaseUrl = 'postgresql://neondb_owner:npg_PBVb6cqt4sFL@ep-morning-lake-ao4bwlif-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

(async () => {
  const ayRows = await sql`SELECT id, "code", "isActive" FROM "AcademicYear" ORDER BY "isActive" DESC, "code" DESC`;
  const activeAy = ayRows.find(r => r.isActive);
  const ayId = activeAy ? activeAy.id : ayRows[0]?.id;
  console.log('activeAy', activeAy || ayRows[0]);

  const students = await sql`SELECT id, "gradeLevel", section, "enrollmentStatus", "academicYearId" FROM "Student" WHERE "academicYearId" = ${ayId} ORDER BY "gradeLevel", section, "lastName"`;
  console.log('students_count', students.length);

  const groups = new Map();
  for (const s of students) {
    const k = `${(s.gradeLevel || '').trim() || 'NO_GRADE'} | ${(s.section || '').trim() || 'NO_SECTION'}`;
    groups.set(k, (groups.get(k) || 0) + 1);
  }
  console.log('GRADE|SECTION counts');
  [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([k, v]) => console.log(v, '|', k));

  const sections = await sql`SELECT id, "sectionName", "gradeLevel", capacity, enrolled, "availableSlots", status, "academicYearId" FROM "Section" WHERE "academicYearId" = ${ayId} ORDER BY "sectionName", "gradeLevel"`;
  console.log('section_count', sections.length);
  console.log('SECTION rows');
  for (const s of sections) {
    console.log(`${s.sectionName} | ${s.gradeLevel} | enrolled=${s.enrolled} available=${s.availableSlots} cap=${s.capacity} status=${s.status}`);
  }

  const summary = {};
  for (const s of sections) {
    const g = (s.gradeLevel || '').trim() || 'NO_GRADE';
    summary[g] = (summary[g] || 0) + 1;
  }
  console.log('sections by grade', JSON.stringify(summary));
})();
