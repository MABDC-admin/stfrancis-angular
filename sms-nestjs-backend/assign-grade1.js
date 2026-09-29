const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('./dist/src/drizzle/schema.js');
const { eq } = require('drizzle-orm');
require('dotenv').config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const email = 'teacher1@sfxsai.com';
  const user = await db.query.user.findFirst({ where: eq(schema.user.email, email) });

  if (user) {
    await db.update(schema.teacherClassAssignment)
      .set({ sectionName: 'SFXSAI', subject: 'Math - Grade 1' })
      .where(eq(schema.teacherClassAssignment.teacherUserId, user.id));
    console.log('Assigned Grade 1 to teacher1@sfxsai.com');
  }
}
run().catch(console.error);
