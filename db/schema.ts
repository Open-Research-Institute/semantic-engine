import { vector32 } from "@/db/types/vector";
import { relations, sql } from "drizzle-orm";
import {
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";

export const datasetsTable = sqliteTable(
    "datasets",
    {
        id: text().primaryKey().notNull(),
        createdAt: integer().default(sql`(unixepoch())`),
        updatedAt: integer().default(sql`(unixepoch())`),
    }
);

export const datasetsRelations = relations(datasetsTable, ({ many }) => ({
    docs: many(docsTable),
}));

// Root documents table (no embeddings)
export const docsTable = sqliteTable(
    "docs",
    {
        id: text().primaryKey().notNull(),
        datasetId: text().notNull(),
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

export const docsRelations = relations(docsTable, ({ many, one }) => ({
    chunks: many(chunksTable),
    dataset: one(datasetsTable, {
        fields: [docsTable.datasetId],
        references: [datasetsTable.id],
    }),
}));

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

export type Dataset = typeof datasetsTable.$inferSelect;
export type DatasetInsert = typeof datasetsTable.$inferInsert;

export type Chunk = typeof chunksTable.$inferSelect;
export type ChunkInsert = typeof chunksTable.$inferInsert;

