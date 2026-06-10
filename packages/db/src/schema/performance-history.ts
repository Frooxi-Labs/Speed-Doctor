import { index, integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { auditRuns } from './audit-runs';
import { websites } from './websites';

export const performanceHistory = pgTable(
  'performance_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    websiteId: uuid('website_id').notNull().references(() => websites.id, {
      onDelete: 'cascade',
    }),
    auditRunId: uuid('audit_run_id').notNull().references(() => auditRuns.id, {
      onDelete: 'cascade',
    }),
    performanceScore: integer('performance_score').notNull().default(0),
    lcpMs: integer('lcp_ms').notNull().default(0),
    cls: integer('cls').notNull().default(0),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    websiteIdIdx: index('performance_history_website_id_idx').on(table.websiteId),
    auditRunIdIdx: index('performance_history_audit_run_id_idx').on(table.auditRunId),
  }),
);
