const { neon } = require('@neondatabase/serverless');
const databaseUrl = 'postgresql://neondb_owner:npg_PBVb6cqt4sFL@ep-morning-lake-ao4bwlif-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);
(async()=>{
  const statusRows = await sql`SELECT "enrollmentStatus", COUNT(*)::int AS count FROM "Student" GROUP BY "enrollmentStatus" ORDER BY "enrollmentStatus"`;
  console.log(statusRows);
})();
