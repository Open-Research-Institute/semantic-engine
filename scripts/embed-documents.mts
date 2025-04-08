import { db } from '@/db/db.js';
import { chunksTable } from '@/db/schema.js';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { embedMany } from 'ai';
import { and, asc, gt, inArray, isNull, sql } from 'drizzle-orm';

const lmstudio = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://localhost:1234/v1',
});

async function getChunksWithoutEmbeddings(batchSize: number, cursor?: number) {
    return db
        .select({
            id: chunksTable.id,
            content: chunksTable.content,
        })
        .from(chunksTable)
        .where(
            and(
                isNull(chunksTable.embedding),
                cursor ? gt(chunksTable.id, cursor) : undefined
            )
        )
        .orderBy(asc(chunksTable.id)) // Order by ID for cursor pagination
        .limit(batchSize);
}

async function embedChunks(batchSize = 100) {
    let totalProcessed = 0;
    let cursor: number | undefined = undefined;

    // Fetch the initial batch
    let currentChunks = await getChunksWithoutEmbeddings(batchSize, cursor);

    while (currentChunks.length > 0) {
        // Determine the cursor for the next fetch based on the current batch
        const nextCursor = currentChunks[currentChunks.length - 1].id;

        // Start prefetching the next batch asynchronously
        const nextChunksPromise = getChunksWithoutEmbeddings(batchSize, nextCursor);

        console.log(`Processing batch of ${currentChunks.length} chunks starting after ID: ${cursor ?? 'beginning'}`);

        try {
            // Process the current batch (embedding + DB update)
            const { embeddings } = await embedMany({
                model: lmstudio.textEmbeddingModel(process.env.LMSTUDIO_EMBEDDING_MODEL!),
                values: currentChunks.map(chunk => chunk.content),
            });

            if (embeddings.length > 0) {
                const sqlChunks = [];
                const ids = currentChunks.map(chunk => chunk.id);

                sqlChunks.push(sql`(case`);
                for (let i = 0; i < currentChunks.length; i++) {
                    sqlChunks.push(sql`when ${chunksTable.id} = ${currentChunks[i].id} then ${JSON.stringify(embeddings[i])}`);
                }
                sqlChunks.push(sql`end)`);

                const finalSql = sql.join(sqlChunks, sql.raw(' '));

                await db.update(chunksTable)
                    .set({ embedding: finalSql })
                    .where(inArray(chunksTable.id, ids));

                console.log(`Successfully embedded and updated ${currentChunks.length} chunks.`);
                totalProcessed += currentChunks.length;
            }
        } catch (error) {
            console.error(`Error embedding ${currentChunks.length} chunks:`, error);
            // We will still advance to the next prefetched batch even if this one failed.
        }

        // Update the main cursor to the end of the batch we just processed
        cursor = nextCursor;

        // Wait for the prefetched batch to be ready for the next iteration
        console.log("Waiting for next batch prefetched...");
        currentChunks = await nextChunksPromise;

        console.log(`Batch complete. Total chunks processed so far: ${totalProcessed}`);
    }

    console.log('No more chunks to embed.');
    return totalProcessed;
}

async function main() {
    const batchSize = Number(process.argv[2]) || 100;
    console.log(`Starting embedding process with batch size: ${batchSize}`);

    const totalProcessed = await embedChunks(batchSize);
    console.log(`Embedding process complete. Total chunks processed: ${totalProcessed}`);
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
