const { neon } = require('@neondatabase/serverless');
const databaseUrl = 'postgresql://neondb_owner:npg_PBVb6cqt4sFL@ep-morning-lake-ao4bwlif-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);
(async()=>{
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='AcademicYear' ORDER BY ordinal_position`;
  console.log(cols);
})();
