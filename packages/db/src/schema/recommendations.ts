import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { issues } from './issues';

export const recommendations = pgTable(
  'recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    issueId: uuid('issue_id').notNull().references(() => issues.id, {
      onDelete: 'cascade',
    }),
    fixType: text('fix_type').notNull(),
    humanFix: text('human_fix').notNull(),
    codeFix: text('code_fix').notNull(),
    estimatedGainScore: integer('estimated_gain_score').notNull().default(0),
    difficulty: text('difficulty').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    issueIdIdx: index('recommendations_issue_id_idx').on(table.issueId),
  }),
);
