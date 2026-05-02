import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql } from 'drizzle-orm'
import { adminUsers, adminRoleEnum, type AdminRole } from '../src/db/schema/admin_users'
import { DEFAULT_ORG_ID } from '../src/db/schema/organizations'

function usage() {
  console.error(`
Usage: pnpm tsx scripts/create-admin.ts <email> <password> <name> [role]
  role: owner | admin | partner  (default: owner)

Example:
  pnpm tsx scripts/create-admin.ts you@example.com 'YourPass123' '你的名字' owner
`)
  process.exit(1)
}

async function main() {
  const [email, password, name, roleArg = 'owner'] = process.argv.slice(2)
  if (!email || !password || !name) usage()

  if (!adminRoleEnum.includes(roleArg as AdminRole)) {
    console.error(`Invalid role "${roleArg}". Must be one of: ${adminRoleEnum.join(', ')}`)
    process.exit(1)
  }
  const role = roleArg as AdminRole

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const dbUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL
  if (!supabaseUrl || !serviceKey || !dbUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL')
    process.exit(1)
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`1/2 Creating Supabase Auth user for ${email}...`)
  let supabaseUserId: string

  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (createErr) {
    if (createErr.message?.includes('already been registered')) {
      console.log('  User already exists, looking up...')
      const { data: list } = await sb.auth.admin.listUsers()
      const existing = list.users.find((u) => u.email === email)
      if (!existing) {
        console.error('  Could not find existing user.')
        process.exit(1)
      }
      supabaseUserId = existing.id
    } else {
      console.error(`  Error: ${createErr.message}`)
      process.exit(1)
    }
  } else {
    supabaseUserId = created.user.id
  }

  console.log(`  Supabase user id: ${supabaseUserId}`)

  console.log(`2/2 Upserting admin_users record...`)
  const client = postgres(dbUrl, { max: 1, prepare: false })
  const db = drizzle(client)

  await db
    .insert(adminUsers)
    .values({
      orgId: DEFAULT_ORG_ID,
      supabaseUserId,
      email,
      name,
      role,
    })
    .onConflictDoUpdate({
      target: adminUsers.supabaseUserId,
      set: { name, role, email, updatedAt: new Date() },
    })

  const result = await db
    .select()
    .from(adminUsers)
    .where(sql`supabase_user_id = ${supabaseUserId}`)
    .limit(1)

  console.log('Done. Admin user:')
  console.log(result[0])

  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
