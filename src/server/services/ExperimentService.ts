import 'server-only'
import { cookies } from 'next/headers'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  experiments,
  experimentExposures,
  type Experiment,
} from '@/db/schema/experiments'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import {
  VISITOR_COOKIE,
  generateVisitorId,
  pickVariant,
  type VariantSpec,
} from '@/lib/experiments'

export async function getOrCreateVisitorId(): Promise<string> {
  const store = await cookies()
  const existing = store.get(VISITOR_COOKIE)?.value
  if (existing) return existing
  const id = generateVisitorId()
  store.set(VISITOR_COOKIE, id, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60,
    path: '/',
  })
  return id
}

export async function getExperiment(key: string): Promise<Experiment | null> {
  const [row] = await db
    .select()
    .from(experiments)
    .where(
      and(
        eq(experiments.orgId, DEFAULT_ORG_ID),
        eq(experiments.key, key),
        eq(experiments.isActive, true)
      )
    )
    .limit(1)
  return row ?? null
}

/**
 * Returns the variant a visitor should see for this experiment, or null
 * if the experiment doesn't exist / is not active.
 */
export async function getVariant(experimentKey: string): Promise<VariantSpec | null> {
  const exp = await getExperiment(experimentKey)
  if (!exp || !exp.variants || exp.variants.length === 0) return null

  const visitorId = await getOrCreateVisitorId()
  return pickVariant(visitorId, exp.key, exp.variants)
}

export async function trackExposure(
  experimentKey: string,
  variantKey: string,
  eventType: 'exposure' | 'conversion',
  payload?: Record<string, unknown>
): Promise<void> {
  const visitorId = await getOrCreateVisitorId()
  await db.insert(experimentExposures).values({
    orgId: DEFAULT_ORG_ID,
    experimentKey,
    variantKey,
    visitorId,
    eventType,
    payload: payload ?? null,
  })
}

export interface ExperimentSummary {
  experiment: Experiment
  variantStats: Array<{
    variantKey: string
    exposures: number
    conversions: number
    cvr: number // 0..1
  }>
}

export async function listExperimentsWithStats(): Promise<ExperimentSummary[]> {
  const exps = await db
    .select()
    .from(experiments)
    .where(eq(experiments.orgId, DEFAULT_ORG_ID))
    .orderBy(desc(experiments.createdAt))

  const summaries: ExperimentSummary[] = []
  for (const exp of exps) {
    const stats = await db
      .select({
        variantKey: experimentExposures.variantKey,
        exposures: sql<number>`count(*) filter (where ${experimentExposures.eventType} = 'exposure')::int`,
        conversions: sql<number>`count(*) filter (where ${experimentExposures.eventType} = 'conversion')::int`,
      })
      .from(experimentExposures)
      .where(eq(experimentExposures.experimentKey, exp.key))
      .groupBy(experimentExposures.variantKey)
      .orderBy(asc(experimentExposures.variantKey))

    const variantStats = (exp.variants ?? []).map((v) => {
      const stat = stats.find((s) => s.variantKey === v.key)
      const exposures = stat?.exposures ?? 0
      const conversions = stat?.conversions ?? 0
      return {
        variantKey: v.key,
        exposures,
        conversions,
        cvr: exposures > 0 ? conversions / exposures : 0,
      }
    })

    summaries.push({ experiment: exp, variantStats })
  }
  return summaries
}
