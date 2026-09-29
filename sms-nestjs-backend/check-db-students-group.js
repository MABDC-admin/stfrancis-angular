const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('./dist/src/drizzle/schema.js');
const relations = require('./dist/src/drizzle/relations.js');
const { eq } = require('drizzle-orm');
require('dotenv').config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema: { ...schema, ...relations } });

  const students = await db.query.student.findMany();
  
  const groups = {};
  students.forEach(s => {
    const key = `${s.gradeLevel} - ${s.section}`;
    groups[key] = (groups[key] || 0) + 1;
  });
  
  console.log('Total students:', students.length);
  console.log('Grouped by Grade and Section:', groups);
}
run().catch(console.error);
