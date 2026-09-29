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
  console.log('Students:', students.map(s => ({
    id: s.id,
    name: s.firstName + ' ' + s.lastName,
    gradeLevel: s.gradeLevel,
    section: s.section
  })));
}
run().catch(console.error);
