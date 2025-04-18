import { vector32 } from "@/db/types/vector";
import { relations, sql } from "drizzle-orm";
import {
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";

// Root documents table (no embeddings)
export const docsTable = sqliteTable(
    "docs",
    {
        id: text().primaryKey().notNull(),
        externalId: text().notNull(),
        createdAt: integer().notNull(),
        origin: text({ enum: ["community-archive"] }).notNull(),
        url: text(),
        content: text().notNull(),
        ingestedAt: integer().default(sql`(unixepoch())`),
        author: text().notNull(),
        checksum: text().notNull(),
    }
);

export const chunksTable = sqliteTable(
    "chunks",
    {
        id: integer().primaryKey(),
        docId: text().notNull(),            // Reference to root document
        embedding: vector32({ dimensions: 768 }),
        content: text().notNull(),
        startPosition: integer(),
        endPosition: integer(),
    }
);

export const chunksRelations = relations(chunksTable, ({ one }) => ({
    parent: one(docsTable, {
        relationName: "doc",
        fields: [chunksTable.docId],
        references: [docsTable.id],
    }),
}));

export type Doc = typeof docsTable.$inferSelect;
export type DocInsert = typeof docsTable.$inferInsert;

export type Chunk = typeof chunksTable.$inferSelect;
export type ChunkInsert = typeof chunksTable.$inferInsert;

