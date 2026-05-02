import 'dotenv/config'
import { db } from './client'
import { organizations, DEFAULT_ORG_ID } from './schema/organizations'
import { sql } from 'drizzle-orm'

async function seed() {
  console.log('Seeding default organization...')

  await db
    .insert(organizations)
    .values({
      id: DEFAULT_ORG_ID,
      slug: 'default',
      name: '日系選物店',
      plan: 'owner',
      billingStatus: 'active',
    })
    .onConflictDoNothing({ target: organizations.id })

  const [org] = await db
    .select()
    .from(organizations)
    .where(sql`id = ${DEFAULT_ORG_ID}`)
    .limit(1)

  console.log('Default organization:', org)
  console.log('Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
