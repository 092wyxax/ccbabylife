import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const privilegedSql = postgres(connectionString, {
  max: 10,
  prepare: false,
  idle_timeout: 20,
})

export const db = drizzle(privilegedSql, { schema })

export { schema }
