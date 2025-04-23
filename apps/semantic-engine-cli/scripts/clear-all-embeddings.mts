import { db } from "@/db/db";
import { chunksTable } from '@/db/schema';
import { isNotNull } from 'drizzle-orm';

const result = await db
    .update(chunksTable)
    .set({
        embedding: null
    }).where(isNotNull(chunksTable.embedding));

console.log(`Cleared ${result.rowsAffected} embeddings`);