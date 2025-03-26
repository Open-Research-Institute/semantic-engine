#!/usr/bin/env tsx

import { db } from '@/db/db.js';
import { docsTable } from '@/db/schema.js';
import { communityArchiveClient } from "@/lib/community-archive/client";
import { and, asc, desc, eq } from 'drizzle-orm';

const [username] = process.argv.slice(2);

async function getExistingTweetRange(accountId: string) {
    // Get the oldest tweet (lowest ID)
    const oldestTweet = await db
        .select({ id: docsTable.id })
        .from(docsTable)
        .where(and(
            eq(docsTable.source, 'community-archive'),
            eq(docsTable.creatorId, accountId)
        ))
        .orderBy(asc(docsTable.id))
        .limit(1)
        .then(rows => rows[0]);

    if (!oldestTweet) {
        return null;
    }

    // Get the newest tweet (highest ID)
    const newestTweet = await db
        .select({ id: docsTable.id })
        .from(docsTable)
        .where(and(
            eq(docsTable.source, 'community-archive'),
            eq(docsTable.creatorId, accountId)
        ))
        .orderBy(desc(docsTable.id))
        .limit(1)
        .then(rows => rows[0]);

    return {
        oldestId: oldestTweet.id,
        newestId: newestTweet.id
    };
}

async function getTweetsBatch(accountId: string, existingRange: { oldestId: string, newestId: string } | null, offset: number, batchSize: number) {
    const query: Record<string, string> = {
        account_id: `eq.${accountId}`,
        limit: batchSize.toString(),
        offset: offset.toString(),
        order: "created_at.desc"
    };

    // If we have existing tweets, only fetch tweets outside that range
    if (existingRange) {
        query.tweet_id = `or.(lt.${existingRange.oldestId},gt.${existingRange.newestId})`;
    }

    const response = await communityArchiveClient.GET("/tweets", {
        params: {
            query
        }
    });

    return response.data || [];
}

if (!username) {
    console.error("Please provide a username");
    process.exit(1);
}

async function main() {
    const accountId = await communityArchiveClient.GET("/account", { params: { query: { username: `eq.${username}` } } })
        .then((res) => res.data?.[0]?.account_id);

    if (!accountId) {
        console.error("No account found for username:", username);
        process.exit(1);
    }

    console.log("Checking for existing tweets...");
    const existingRange = await getExistingTweetRange(accountId);

    if (existingRange) {
        console.log(`Found existing tweets with ID range: ${existingRange.oldestId} to ${existingRange.newestId}`);
    } else {
        console.log("No existing tweets found, will fetch all tweets");
    }

    console.log("Fetching tweets for account:", accountId);

    let batchSize = 1000;
    let offset = 0;
    let done = false;
    let totalFetched = 0;

    while (!done) {
        const tweets = await getTweetsBatch(accountId, existingRange, offset, batchSize);

        if (tweets.length === 0) {
            done = true;
        } else {
            console.log(`Got batch of ${tweets.length} tweets, inserting into database...`);

            // Insert tweets without embeddings
            const inserts = tweets.map(tweet => ({
                id: tweet.tweet_id!,
                content: tweet.full_text,
                embedding: null, // No embedding yet
                source: "community-archive" as const,
                createdAt: new Date(tweet.created_at).getTime() / 1000,
                creatorId: tweet.account_id,
            }));

            // Insert in smaller batches to avoid overwhelming the database
            const insertBatchSize = 100;
            for (let i = 0; i < inserts.length; i += insertBatchSize) {
                const batch = inserts.slice(i, i + insertBatchSize);
                await db.insert(docsTable).values(batch);
                console.log(`Inserted ${batch.length} tweets (${i + batch.length}/${inserts.length})`);
            }

            totalFetched += tweets.length;
            offset += batchSize;
        }
    }

    console.log(`Finished fetching ${totalFetched} tweets. Run embed-documents.mts to generate embeddings.`);
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});

