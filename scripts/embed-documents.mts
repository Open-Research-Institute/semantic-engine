#!/usr/bin/env tsx

import { db } from '@/db/db.js';
import { docsTable } from '@/db/schema.js';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';
import { inArray, isNull, sql } from 'drizzle-orm';

async function getDocumentsWithoutEmbeddings(batchSize: number) {
    return db
        .select({
            id: docsTable.id,
            content: docsTable.content,
            source: docsTable.source,
            creatorId: docsTable.creatorId
        })
        .from(docsTable)
        .where(isNull(docsTable.embedding))
        .limit(batchSize);
}

async function embedDocuments(batchSize = 100) {
    let totalProcessed = 0;
    let done = false;

    while (!done) {
        // Get a batch of documents without embeddings
        const docs = await getDocumentsWithoutEmbeddings(batchSize);

        if (docs.length === 0) {
            done = true;
            console.log('No more documents to embed.');
        } else {
            try {
                // Generate embedding
                const { embeddings } = await embedMany({
                    model: google.textEmbeddingModel('text-embedding-004'),
                    values: docs.map(doc => doc.content),
                });

                // Update documents with their respective embeddings
                if (embeddings.length > 0) {
                    const sqlChunks = [];
                    const ids = docs.map(doc => doc.id);

                    sqlChunks.push(sql`(case`);

                    for (let i = 0; i < docs.length; i++) {
                        sqlChunks.push(sql`when ${docsTable.id} = ${docs[i].id} then ${JSON.stringify(embeddings[i])}`);
                    }

                    sqlChunks.push(sql`end)`);

                    const finalSql = sql.join(sqlChunks, sql.raw(' '));

                    await db.update(docsTable)
                        .set({ embedding: finalSql })
                        .where(inArray(docsTable.id, ids));

                    console.log(`Successfully embedded and updated ${docs.length} documents...`);
                    totalProcessed += docs.length;
                }
            } catch (error) {
                console.error(`Error embedding ${docs.length} documents:`, error);
            }
        }

        console.log(`Batch complete. Total documents processed: ${totalProcessed}`);
    }

    return totalProcessed;
}

async function main() {
    const batchSize = Number(process.argv[2]) || 100;
    console.log(`Starting embedding process with batch size: ${batchSize}`);

    const totalProcessed = await embedDocuments(batchSize);
    console.log(`Embedding process complete. Total documents processed: ${totalProcessed}`);
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
