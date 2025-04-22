import { db } from '@/db/db';
import { ChunkInsert, chunksTable, DocInsert, docsTable } from '@/db/schema';
import { splitText } from '@/lib/utils/split-text';
import Parser from 'rss-parser';
import { xxhash3 } from "hash-wasm";
import { nanoid } from 'nanoid';
import TurndownService from 'turndown'

const CHUNK_SIZE = 512;
const INSERT_BATCH_SIZE = 1000;

// Parse command-line arguments
const args = process.argv.slice(2);
const feedUrl = args[0]; // First argument is the RSS feed URL

if (!feedUrl) {
    console.error('Usage: bun run scripts/load-from-rss.mts <rss-feed-url>');
    process.exit(1);
}

console.log(`Loading feed from: ${feedUrl}`);

let totalItems = 0;
let totalDocs = 0;
let totalChunks = 0;

const parser = new Parser();

async function processFeed() {
    try {
        const feed = await parser.parseURL(feedUrl);
        console.log(`Processing feed: ${feed.title} (${feed.items.length} items)`);
        totalItems = feed.items.length;

        const docs: DocInsert[] = [];
        const allChunks: ChunkInsert[] = [];

        var turndownService = new TurndownService()

        for (const item of feed.items) {
            const contentToProcess = `# ${item.title}` + '\n\n' + turndownService.turndown(item["content:encoded"]) || '';

            if (!item["content:encoded"]) {
                console.warn(`Skipping item with no content: ${item.title || item.link}`);
                continue;
            }

            const externalId = item.link || item.guid;
            if (!externalId) {
                console.warn(`Skipping item with no link or guid: ${item.title || '(no title)'}`);
                continue;
            }

            const docId = nanoid();
            const checksum = await xxhash3(contentToProcess);
            const createdAtTimestamp = item.isoDate ? Math.floor(new Date(item.isoDate).getTime() / 1000) : Math.floor(Date.now() / 1000);

            const doc: DocInsert = {
                id: docId,
                externalId: externalId, // Use the validated externalId
                author: item.creator || feed.title || 'Unknown Author', // Use creator, feed title, or fallback
                checksum: checksum,
                origin: 'rss',
                content: contentToProcess,
                createdAt: createdAtTimestamp,
                url: item.link,
                metadata: {
                    title: item.title,
                },
            };
            docs.push(doc);

            const chunks = splitText(contentToProcess, CHUNK_SIZE).map((chunk) => ({
                docId: docId,
                ...chunk
            }));
            allChunks.push(...chunks);
        }

        // Batch insert documents
        console.log(`Inserting ${docs.length} documents...`);
        for (let i = 0; i < docs.length; i += INSERT_BATCH_SIZE) {
            const batch = docs.slice(i, i + INSERT_BATCH_SIZE);
            await db.insert(docsTable).values(batch);
            console.log(`Inserted doc batch ${i / INSERT_BATCH_SIZE + 1} of ${Math.ceil(docs.length / INSERT_BATCH_SIZE)}`);
        }
        totalDocs = docs.length;

        // Batch insert chunks
        console.log(`Inserting ${allChunks.length} chunks...`);
        for (let i = 0; i < allChunks.length; i += INSERT_BATCH_SIZE) {
            const batch = allChunks.slice(i, i + INSERT_BATCH_SIZE);
            await db.insert(chunksTable).values(batch);
            console.log(`Inserted chunk batch ${i / INSERT_BATCH_SIZE + 1} of ${Math.ceil(allChunks.length / INSERT_BATCH_SIZE)}`);
        }
        totalChunks = allChunks.length;

        console.log(`--------------------------------------------------`);
        console.log(`Feed Processing Complete!`);
        console.log(`Total Items Found: ${totalItems}`);
        console.log(`Total Docs Created: ${totalDocs}`);
        console.log(`Total Chunks Created: ${totalChunks}`);
        console.log(`--------------------------------------------------`);

    } catch (error) {
        console.error(`Error processing feed ${feedUrl}:`, error);
        process.exit(1);
    }
}

processFeed();
