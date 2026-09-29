const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('./dist/src/drizzle/schema.js');
const relations = require('./dist/src/drizzle/relations.js');
require('dotenv').config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema: { ...schema, ...relations } });

  const users = await db.query.user.findMany();
  console.log('Users:');
  users.forEach(u => {
    console.log(`- ${u.email} (${u.role})`);
  });
}
run().catch(console.error);
