const { neon } = require('@neondatabase/serverless');
const databaseUrl = 'postgresql://neondb_owner:npg_PBVb6cqt4sFL@ep-morning-lake-ao4bwlif-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

const norm = (g) => {
  if(!g) return 'NO_GRADE';
  const s = String(g).trim().toLowerCase().replace(/\s+/g,' ');
  const map = {
    'pre-kindergarten':'Nursery','kindergarten':'Nursery','kindergarten 1':'Nursery','nursery':'Nursery','kinder':'Nursery','k1':'Nursery',
    'kinder 2':'K2','kindergarten 2':'K2','k2':'K2','kinder2':'K2'
  };
  if(map[s]) return map[s];
  const m = s.match(/^g?(\d+)$/);
  if (m) {
    return `G${m[1]}`;
  }
  if (s.startsWith('grade ')) return `G${s.split(' ')[1]}`;
  return s;
};

(async()=>{
  const ayRows = await sql`SELECT id, code FROM "AcademicYear" WHERE "isActive"=true LIMIT 1`;
  const ayId = ayRows[0].id;
  const students = await sql`SELECT gradeLevel FROM "Student" WHERE "academicYearId"=${ayId}`;
  const bag={};
  for (const row of students) {
    const k = norm(row.gradeLevel);
    bag[k]=(bag[k]||0)+1;
  }
  console.log('active students by normalized grade',bag);
})();
