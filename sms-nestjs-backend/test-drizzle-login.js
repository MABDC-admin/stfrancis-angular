const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('./dist/src/drizzle/schema.js');
const relations = require('./dist/src/drizzle/relations.js');
const { eq } = require('drizzle-orm');
require('dotenv').config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema: { ...schema, ...relations } });

  const users = await db.query.user.findMany({
    with: { teacherClassAssignments: true }
  });
  const teachersWithClasses = users.filter(u => u.teacherClassAssignments && u.teacherClassAssignments.length > 0);
  console.log('Teachers with classes:', teachersWithClasses.map(u => ({ email: u.email, classes: u.teacherClassAssignments.map(c => c.subject + ' - ' + c.sectionName) })));
}
run().catch(console.error);
