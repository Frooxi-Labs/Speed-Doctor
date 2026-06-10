import { index, integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { auditRuns } from './audit-runs';

export const auditScores = pgTable(
  'audit_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    auditRunId: uuid('audit_run_id').notNull().references(() => auditRuns.id, {
      onDelete: 'cascade',
    }),
    performance: integer('performance').notNull().default(0),
    seo: integer('seo').notNull().default(0),
    accessibility: integer('accessibility').notNull().default(0),
    bestPractices: integer('best_practices').notNull().default(0),
    lcpMs: integer('lcp_ms').notNull().default(0),
    cls: integer('cls').notNull().default(0),
    inpMs: integer('inp_ms').notNull().default(0),
    fcpMs: integer('fcp_ms').notNull().default(0),
    ttfbMs: integer('ttfb_ms').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    auditRunIdIdx: index('audit_scores_audit_run_id_idx').on(table.auditRunId),
  }),
);
