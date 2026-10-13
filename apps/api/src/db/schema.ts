import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const healthchecks = sqliteTable('healthchecks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checkedAt: text('checked_at').notNull(),
});
