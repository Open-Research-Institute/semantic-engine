export interface Chunk {
    startPosition: number;
    endPosition: number;
    content: string;
}

export const splitText = (text: string, chunkSize: number): Chunk[] => {
    if (chunkSize <= 0) {
        throw new Error("chunkSize must be greater than 0");
    }

    if (!text || text.length === 0) {
        return [];
    }

    // Using markdown-friendly separators, prioritizing more structured ones first.
    const separators = [
        // Markdown headings
        "\n## ", "\n### ", "\n#### ", "\n##### ", "\n###### ",
        // Double newline (paragraphs)
        "\n\n",
        // Single newline
        "\n",
        // Space
        " ",
        // Empty string (split by character as last resort)
        "",
    ];

    const splitRecursive = (
        currentText: string,
        startOffset: number, // Offset relative to original text start
        currentSeparators: string[]
    ): Chunk[] => {
        const chunks: Chunk[] = [];
        let currentPosition = 0; // Position relative to currentText start

        // Base case: If the current text fits within the chunk size, return it as a single chunk.
        if (currentText.length <= chunkSize) {
            if (currentText.length > 0) { // Avoid adding empty chunks
                chunks.push({
                    startPosition: startOffset,
                    endPosition: startOffset + currentText.length - 1,
                    content: currentText
                });
            }
            return chunks;
        }

        // Find the highest priority separator present in the current text.
        let separator: string | null = null;
        let nextSeparators: string[] = [];
        for (let i = 0; i < currentSeparators.length; i++) {
            const s = currentSeparators[i];
            if (s === "") {
                // Empty string separator is the last resort.
                if (separator === null) separator = s;
                break;
            }
            if (currentText.includes(s)) {
                separator = s;
                nextSeparators = currentSeparators.slice(i + 1);
                break;
            }
        }

        // If no separator is found (should only happen if separators array is modified), or if the only separator is "" but the text fits, treat as a single chunk.
        if (separator === null || (separator === "" && currentText.length <= chunkSize)) {
            if (currentText.length > 0) {
                chunks.push({
                    startPosition: startOffset,
                    endPosition: startOffset + currentText.length - 1,
                    content: currentText
                });
            }
            return chunks;
        }

        // Perform the split using the chosen separator.
        let splits: string[];
        if (separator === "") {
            // Split by character if "" is the separator.
            splits = currentText.split('');
        } else {
            // Use regex lookahead `(?=...)` to split *before* the separator, keeping the separator itself
            // at the beginning of the subsequent split part.
            const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Use double quotes to avoid escaping issues
            const regex = new RegExp(`(?=${escapedSeparator})`);
            splits = currentText.split(regex).filter(s => s !== ""); // Filter out potential empty strings from split
        }

        let chunkBuffer: string = ""; // Buffer to accumulate small splits into a larger chunk.
        let chunkBufferStartPos = -1; // Tracks the absolute start position of the buffered content.

        for (const split of splits) {
            const splitLen = split.length;
            const splitStartOffset = startOffset + currentPosition; // Absolute start position of this split piece.

            // If the current split piece *by itself* is larger than the chunk size,
            // it needs to be split further recursively.
            if (splitLen > chunkSize) {
                // First, finalize and add any chunk currently in the buffer.
                if (chunkBuffer.length > 0) {
                    chunks.push({
                        startPosition: chunkBufferStartPos,
                        endPosition: chunkBufferStartPos + chunkBuffer.length - 1,
                        content: chunkBuffer
                    });
                    chunkBuffer = "";
                    chunkBufferStartPos = -1;
                }

                // Recursively split the large piece using the next level of separators.
                chunks.push(...splitRecursive(split, splitStartOffset, nextSeparators));

            } else {
                // If adding this split to the buffer would exceed the chunk size...
                if (chunkBuffer.length + splitLen > chunkSize) {
                    // Finalize the buffered chunk *before* adding the current split.
                    if (chunkBuffer.length > 0) {
                        chunks.push({
                            startPosition: chunkBufferStartPos,
                            endPosition: chunkBufferStartPos + chunkBuffer.length - 1,
                            content: chunkBuffer
                        });
                    }
                    // Start a new buffer with the current split.
                    chunkBuffer = split;
                    chunkBufferStartPos = splitStartOffset;
                } else {
                    // Otherwise, add the current split to the buffer.
                    if (chunkBufferStartPos === -1) {
                        chunkBufferStartPos = splitStartOffset; // Mark the start if buffer was empty.
                    }
                    chunkBuffer += split;
                }
            }
            // Advance the position tracker within the currentText.
            currentPosition += splitLen;
        }

        // After the loop, add any remaining content left in the buffer as a final chunk.
        if (chunkBuffer.length > 0) {
            chunks.push({
                startPosition: chunkBufferStartPos,
                endPosition: chunkBufferStartPos + chunkBuffer.length - 1,
                content: chunkBuffer
            });
        }

        return chunks;
    };

    // Initial call to the recursive function.
    return splitRecursive(text, 0, separators);
}