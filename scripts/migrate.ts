import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function main() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL_DIRECT (or DATABASE_URL) not set')
    process.exit(1)
  }

  const sql = postgres(url, { max: 1, prepare: false })
  const db = drizzle(sql)

  console.log('Applying migrations from src/db/migrations/...')
  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' })
    console.log('✓ Migrations applied successfully')
  } catch (e) {
    console.error('✗ Migration failed:')
    console.error(e)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
