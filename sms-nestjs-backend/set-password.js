const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('./dist/src/drizzle/schema.js');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const email = 'teacher1@sfxsai.com';
  const hashed = await bcrypt.hash('teacher123', 10);
  await db.update(schema.user).set({ password: hashed }).where(eq(schema.user.email, email));

  console.log('Password reset for teacher1@sfxsai.com');
}
run().catch(console.error);
