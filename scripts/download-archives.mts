import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://fabxmporizzqflnftavs.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYnhtcG9yaXp6cWZsbmZ0YXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIyNDQ5MTIsImV4cCI6MjAzNzgyMDkxMn0.UIEJiUNkLsW28tBHmG-RQDW-I5JNlJLt62CSk9D_qG8"
const supabase = createClient(supabaseUrl, supabaseKey)

import fs from 'fs'

// Parse command line arguments (usernames)
const usernames = process.argv.slice(2).map(username => username.toLowerCase());
console.log(usernames.length > 0
    ? `Downloading archives for users: ${usernames.join(', ')}`
    : `No usernames provided. Downloading all archives.`);

// Set parallelism limit with default of 10
const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '10', 10);
console.log(`Downloading with parallelism of ${maxConcurrent}`);

const { data } = await supabase
    .schema('storage')
    .from('objects')
    .select('id, name')
    .eq('bucket_id', 'archives')

// Filter items based on usernames if provided
let itemsToDownload = data!;
if (usernames.length > 0) {
    itemsToDownload = data!.filter(item => {
        const filename = item.name.replace("/archive.json", "");
        return usernames.includes(filename.toLowerCase());
    });
    console.log(`Found ${itemsToDownload.length} matching archives to download:`);
    console.log(itemsToDownload.map(item => item.name).join('\n'));
}

const dir = `./archives`;
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Process downloads in batches
async function downloadItem(item: { name: string }) {
    const { name } = item
    const filename = name.replace("/archive.json", ".json");
    const filePath = `${dir}/${filename}`;

    if (fs.existsSync(filePath)) {
        console.log(filename, 'already exists. Skipping...')
        return;
    }

    console.log('downloading', filename)

    try {
        const result = await supabase
            .storage
            .from('archives')
            .download(name)

        const jsonString = await result!.data!.text();

        fs.writeFileSync(filePath, jsonString);
    } catch (e) {
        console.error('error downloading', filename, '. Skipping...')
    }
}

// Execute downloads with controlled parallelism
async function downloadAll(items: { name: string }[], concurrency: number) {
    const pendingItems = [...items];
    const runningPromises = new Set();

    while (pendingItems.length > 0 || runningPromises.size > 0) {
        // Start new downloads if we have capacity and pending items
        while (runningPromises.size < concurrency && pendingItems.length > 0) {
            const item = pendingItems.shift()!;
            const promise = downloadItem(item).then(() => {
                runningPromises.delete(promise);
            });
            runningPromises.add(promise);
        }

        // Wait for at least one promise to complete before continuing
        if (runningPromises.size > 0) {
            await Promise.race(runningPromises);
        }
    }
}

await downloadAll(itemsToDownload, maxConcurrent);
console.log('All downloads completed');