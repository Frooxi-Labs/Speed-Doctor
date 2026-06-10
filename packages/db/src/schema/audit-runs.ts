import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { websites } from './websites';

export const auditStatusEnum = pgEnum('audit_status', [
  'pending',
  'running',
  'completed',
  'failed',
]);

export const auditRuns = pgTable(
  'audit_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    websiteId: uuid('website_id').notNull().references(() => websites.id, {
      onDelete: 'cascade',
    }),
    status: auditStatusEnum('status').notNull().default('pending'),
    triggeredBy: text('triggered_by').notNull().default('user'),
    deviceType: text('device_type').notNull().default('desktop'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    errorMessage: text('error_message'),
  },
  (table) => ({
    websiteIdIdx: index('audit_runs_website_id_idx').on(table.websiteId),
    createdAtIdx: index('audit_runs_created_at_idx').on(table.createdAt),
  }),
);
