import { boolean, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { auditRuns } from './audit-runs';

export const issues = pgTable(
  'issues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    auditRunId: uuid('audit_run_id').notNull().references(() => auditRuns.id, {
      onDelete: 'cascade',
    }),
    ruleId: text('rule_id').notNull(),
    category: text('category').notNull(),
    severity: text('severity').notNull(),
    title: text('title').notNull(),
    humanDescription: text('human_description').notNull(),
    devDescription: text('dev_description').notNull(),
    elementSelector: text('element_selector'),
    issueData: text('issue_data').notNull().default('{}'),
    isRootCause: boolean('is_root_cause').notNull().default(false),
    estimatedImpactScore: integer('estimated_impact_score').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    auditRunIdIdx: index('issues_audit_run_id_idx').on(table.auditRunId),
  }),
);
