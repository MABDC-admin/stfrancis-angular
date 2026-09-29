const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('./dist/src/drizzle/schema.js');
const relations = require('./dist/src/drizzle/relations.js');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema: { ...schema, ...relations } });

  const email = 'sottodennis@gmail.com';
  const user = await db.query.user.findFirst({
    where: eq(schema.user.email, email)
  });
  
  if (!user) return console.log('not found');
  
  console.log('Password hash:', user.password);
  
  // Test common passwords
  const testPws = ['admin123', 'password', '123456', 'sottodennis', 'password123'];
  for (const pw of testPws) {
    const isMatch = await bcrypt.compare(pw, user.password);
    if (isMatch) console.log('MATCH:', pw);
  }
}
run().catch(console.error);
