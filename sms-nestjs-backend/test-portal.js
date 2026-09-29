const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('./dist/src/drizzle/schema.js');
const relations = require('./dist/src/drizzle/relations.js');
const { eq, inArray, and } = require('drizzle-orm');
require('dotenv').config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema: { ...schema, ...relations } });

  const email = 'teacher1@sfxsai.com';
  const user = await db.query.user.findFirst({ where: eq(schema.user.email, email) });

  const classes = await db.query.teacherClassAssignment.findMany({
    where: eq(schema.teacherClassAssignment.teacherUserId, user.id),
    with: { section: true },
  });

  const profile = await db.query.teacherProfile.findFirst({
    where: eq(schema.teacherProfile.teacherUserId, user.id)
  });

  const sections = Array.from(new Set(classes.map(item => item.sectionName).filter(Boolean)));
  const conditions = [inArray(schema.student.section, sections)];
  if (profile?.assignedGradeLevel) {
    conditions.push(eq(schema.student.gradeLevel, profile.assignedGradeLevel));
  }

  const students = await db.query.student.findMany({
    where: and(...conditions)
  });

  console.log('Profile:', profile);
  console.log('Classes:', classes);
  console.log('Students matched:', students.length);
}
run().catch(console.error);
