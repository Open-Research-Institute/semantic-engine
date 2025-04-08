import { db } from '@/db/db.js';
import { chunksTable, docsTable } from '@/db/schema.js';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { embed } from 'ai';
import { desc, inArray, isNotNull, sql } from 'drizzle-orm';

const lmstudio = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://localhost:1234/v1',
});

const QUERY_EMBEDDING_MODEL = process.env.LMSTUDIO_EMBEDDING_MODEL;

async function queryDocuments(query: string, limit: number = 10) {
    try {
        console.log(`Generating embedding for query using model: ${QUERY_EMBEDDING_MODEL}`);
        const { embedding } = await embed({
            model: lmstudio.textEmbeddingModel(QUERY_EMBEDDING_MODEL!),
            value: query,
        });


        console.log(`Query embedding generated with ${embedding.length} dimensions.`);


        const initialChunkLimit = limit * 5;
        const similarChunks = await db
            .select({
                chunkId: chunksTable.id,
                content: chunksTable.content,
                docId: chunksTable.docId,
                similarity: sql<number>`1 - vector_distance_cos(${chunksTable.embedding}, vector32(${JSON.stringify(embedding)})) as similarity`,
            })
            .from(chunksTable)
            .where(
                isNotNull(chunksTable.embedding)
            )
            .orderBy(desc(sql`similarity`))
            .limit(initialChunkLimit);

        console.log(`Found ${similarChunks.length} potentially relevant chunks.`);

        if (similarChunks.length === 0) {
            return [];
        }

        const rootDocScores = new Map<string, { maxSimilarity: number }>();
        const uniqueRootIds: string[] = [];

        for (const chunk of similarChunks) {
            if (!rootDocScores.has(chunk.docId)) {
                if (uniqueRootIds.length < limit) {
                    uniqueRootIds.push(chunk.docId);
                    rootDocScores.set(chunk.docId, { maxSimilarity: chunk.similarity });
                } else {
                    break;
                }
            }
            const existing = rootDocScores.get(chunk.docId);
            if (existing && chunk.similarity > existing.maxSimilarity) {
                existing.maxSimilarity = chunk.similarity;
            }
        }
        console.log(`Deduplicated to ${uniqueRootIds.length} unique root documents.`);

        const rootDocs = await db
            .select({
                id: docsTable.id,
                origin: docsTable.origin,
                url: docsTable.url,
                createdAt: docsTable.createdAt,
                content: docsTable.content,
                author: docsTable.author
            })
            .from(docsTable)
            .where(inArray(docsTable.id, uniqueRootIds));

        const finalResults = rootDocs.map(doc => {
            const scoreInfo = rootDocScores.get(doc.id);
            const displayContent = doc.content;
            return {
                ...doc,
                content: displayContent,
                similarity: scoreInfo?.maxSimilarity ?? 0,
            };
        })
            .sort((a, b) => b.similarity - a.similarity);

        console.log(`Returning ${finalResults.length} sorted root documents.`);
        return finalResults;

    } catch (error) {
        console.error('Error querying documents:', error);
        throw error;
    }
}

async function main() {
    const query = process.argv[2];
    if (!query) {
        console.error('Please provide a query string as an argument');
        process.exit(1);
    }

    const finalLimit = 10;

    console.log(`Searching for: "${query}" (Limit: ${finalLimit})`);
    const results = await queryDocuments(query, finalLimit);

    if (!results || results.length === 0) {
        console.log("No results found.");
        return;
    }

    console.log('\nResults:');
    console.log('--------');
    results.forEach((result, index) => {
        console.log(`\n${index + 1}. Similarity: ${result.similarity.toFixed(4)}`);
        console.log(`Source: ${result.origin}`);
        console.log(`Creator: ${result.author}`);
        if (result.url) {
            console.log(`URL: ${result.url}`);
        }
        console.log(`Content: ${result.content ? result.content : '[No content in DB]'}`);
    });
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
}); 