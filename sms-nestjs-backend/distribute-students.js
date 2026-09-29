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
  
  const grades = [
    'Nursery', 'Kinder', 
    'Grade 1', 'Grade 2', 'Grade 3', 
    'Grade 4', 'Grade 5', 'Grade 6'
  ];

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const newGrade = grades[i % grades.length];
    
    await db.update(schema.student)
      .set({ 
        gradeLevel: newGrade,
        section: 'SFXSAI' // Standardizing section name for existing classes
      })
      .where(eq(schema.student.id, s.id));
  }
  
  console.log(`Successfully distributed ${students.length} students across 8 grade levels.`);
}
run().catch(console.error);
