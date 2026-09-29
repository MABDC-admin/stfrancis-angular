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

  const email = 'admin@sfxsai.com';
  const user = await db.query.user.findFirst({
    where: eq(schema.user.email, email)
  });
  
  if (!user) {
    console.log('User not found:', email);
    return;
  }
  console.log('User found:', user.email);
  const isMatch = await bcrypt.compare('admin123', user.password);
  console.log('Password match (admin123):', isMatch);
}
run().catch(console.error);
