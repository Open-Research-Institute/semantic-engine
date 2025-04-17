import { db } from '@/db/db';
import { ChunkInsert, chunksTable, DocInsert, docsTable } from '@/db/schema';
import { Archive } from '@/lib/community-archive/types';
import { splitText } from '@/lib/utils/split-text';
import fs from 'fs';
import { xxhash3 } from "hash-wasm";
import { nanoid } from 'nanoid';

// Parse command-line arguments - all but the last argument are archive paths
const args = process.argv.slice(2);
const datasetId = process.env.DATASET_ID! // Last argument is the dataset ID
const archivePaths = args; // All remaining arguments are archive paths

if (archivePaths.length === 0) {
    console.error('Usage: bun run scripts/load-archives.mts <archive-path1> [archive-path2 ...]');
    process.exit(1);
}

console.log(`Loading ${archivePaths.length} archives into dataset: ${datasetId}`);

let totalDocs = 0;
let totalChunks = 0;
let totalTweets = 0;

// Process each archive filex
for (const archivePath of archivePaths) {
    if (!fs.existsSync(archivePath)) {
        console.error(`Archive file not found: ${archivePath}`);
        continue;
    }

    console.log(`Processing: ${archivePath}`);
    const archive: Archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));

    const username = archive.account[0].account.username;
    const userId = archive.account[0].account.accountId;

    // Single tweet threads too
    const filteredTweets = archive['tweets']
        .map(({ tweet }) => tweet)
        .filter((tweet) => {
            // ignore retweets
            if (tweet.full_text.startsWith('RT')) return false
            // ignore tweets that are replies to tweets by other users
            if (tweet.in_reply_to_user_id && tweet.in_reply_to_user_id !== userId) return false
            return true;
        })
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const threads = filteredTweets.reduce((threadMap, tweet) => {
        const replyToId = tweet.in_reply_to_status_id;

        if (!replyToId) return {
            ...threadMap,
            [tweet.id]: {
                ...tweet,
                threadRootId: tweet.id,
            }
        }

        const parentThread = threadMap[replyToId];
        if (!parentThread) return threadMap

        // Add the new entry and remove the old one
        threadMap[tweet.id] = {
            ...parentThread,
            threadRootId: parentThread.threadRootId,
            full_text: parentThread.full_text + '\n\n' + tweet.full_text,
        };
        delete threadMap[replyToId];
        return threadMap;
    }, {} as Record<string, typeof archive['tweets'][number]['tweet'] & { threadRootId: string }>);

    const docs: DocInsert[] = await Promise.all(Object.values(threads)
        .map(async (thread) => {
            return {
                id: nanoid(),
                externalId: `${thread.threadRootId}`,
                author: username,
                checksum: await xxhash3(thread.full_text),
                origin: 'community-archive',
                content: thread.full_text,
                createdAt: Math.floor(new Date(thread.created_at).getTime() / 1000),
                source: 'community-archive',
                url: `https://x.com/${username}/status/${thread.threadRootId}`,
            }
        }));

    if (docs.length === 0) {
        console.log(`No threads found for ${username}`);
        continue;
    }

    const insertBatchSize = 1000;
    for (let i = 0; i < docs.length; i += insertBatchSize) {
        const batch = docs.slice(i, i + insertBatchSize);
        await db.insert(docsTable).values(batch);
    }

    const chunks: ChunkInsert[] = docs.flatMap(doc => splitText(doc.content, 512).map((chunk) => ({
        docId: doc.id,
        ...chunk
    })));

    for (let i = 0; i < chunks.length; i += insertBatchSize) {
        const batch = chunks.slice(i, i + insertBatchSize);
        await db.insert(chunksTable).values(batch);
    }

    console.log(`Loaded ${docs.length} threads, ${chunks.length} chunks from ${username}'s ${filteredTweets.length} tweets`);

    totalDocs += docs.length;
    totalChunks += chunks.length;
    totalTweets += filteredTweets.length;
}

console.log(`Complete! Total: ${totalDocs} threads, ${totalChunks} chunks from ${totalTweets} tweets`);