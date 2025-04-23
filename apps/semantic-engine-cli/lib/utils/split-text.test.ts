import { describe, expect, it } from "bun:test";
import { splitText } from "./split-text";

describe("splitText", () => {
    it("should return empty array for empty text", () => {
        const result = splitText("", 100);
        expect(result).toEqual([]);
    });

    it("should throw error for invalid chunk size", () => {
        expect(() => splitText("some text", 0)).toThrow();
        expect(() => splitText("some text", -10)).toThrow();
    });

    it("should return text as single chunk if shorter than chunk size", () => {
        const text = "This is a short text";
        const result = splitText(text, 100);

        expect(result.length).toBe(1);

        // Expect the original content, exactly as input
        expect(result[0].content).toBe(text);
        expect(result[0].startPosition).toBe(0);
        expect(result[0].endPosition).toBe(text.length - 1);
    });

    it("should split text by size when no natural boundaries exist", () => {
        const text = "abcdefghijklmnopqrstuvwxyz";
        const chunkSize = 10;
        const result = splitText(text, chunkSize);

        expect(result.length).toBe(3);
        expect(result[0]).toEqual({
            startPosition: 0,
            endPosition: 9,
            content: "abcdefghij"
        });
        expect(result[1]).toEqual({
            startPosition: 10,
            endPosition: 19,
            content: "klmnopqrst"
        });
        expect(result[2]).toEqual({
            startPosition: 20,
            endPosition: 25,
            content: "uvwxyz"
        });
    });

    it("should respect markdown headings as natural boundaries", () => {
        const text = "# Title\n\n## Section 1\n\nThis is content for section 1.\n\n## Section 2\n\nThis is content for section 2.";
        const result = splitText(text, 50);

        // Check that we're splitting at markdown headings
        expect(result.length).toBeGreaterThan(1);

        // Check that headings are preserved in the chunks
        const hasHeadings = result.some(chunk =>
            chunk.content.includes("#") &&
            (chunk.content.includes("Title") || chunk.content.includes("Section"))
        );
        expect(hasHeadings).toBe(true);

        // Verify the content is present
        const allContent = result.map(chunk => chunk.content).join("");
        expect(allContent.includes("Title")).toBe(true);
        expect(allContent.includes("Section 1")).toBe(true);
        expect(allContent.includes("Section 2")).toBe(true);
    });

    it("should respect paragraphs as natural boundaries", () => {
        const text = "This is paragraph 1.\n\nThis is paragraph 2.\n\nThis is paragraph 3.";

        // With smaller chunk size
        const smallerResult = splitText(text, 25);
        expect(smallerResult.length).toBeGreaterThan(1);

        // Check that paragraphs are preserved
        const paragraphs = smallerResult.map(chunk => chunk.content);
        const foundPara1 = paragraphs.some(p => p.includes("paragraph 1"));
        const foundPara2 = paragraphs.some(p => p.includes("paragraph 2"));
        const foundPara3 = paragraphs.some(p => p.includes("paragraph 3"));

        expect(foundPara1).toBe(true);
        expect(foundPara2).toBe(true);
        expect(foundPara3).toBe(true);
    });

    it("should correctly track positions in original text", () => {
        const text = "First part.\n\nSecond part.\n\nThird part.";
        const result = splitText(text, 15);

        expect(result.length).toBeGreaterThan(1);

        // Verify that positions increase across chunks
        let lastEndPosition = -1;
        for (const chunk of result) {
            expect(chunk.startPosition).toBeGreaterThan(lastEndPosition);
            lastEndPosition = chunk.endPosition;
        }

        // Verify the content is present
        const allContent = result.map(chunk => chunk.content).join("");
        expect(allContent.includes("First part")).toBe(true);
        expect(allContent.includes("Second part")).toBe(true);
        expect(allContent.includes("Third part")).toBe(true);
    });

    it("should handle mixed content with different separators", () => {
        const text = "# Main Title\n\n## Section 1\nSome text in section 1\n\n## Section 2\nSome longer text that spans multiple lines\nin section 2 of the document.\n\n## Section 3\nFinal section.";
        const result = splitText(text, 50);

        expect(result.length).toBeGreaterThan(1);

        // Verify the chunks contain expected content
        let foundMainTitle = false;
        let foundSection1 = false;
        let foundSection2 = false;
        let foundSection3 = false;

        for (const chunk of result) {
            if (chunk.content.includes("Main Title")) foundMainTitle = true;
            if (chunk.content.includes("Section 1")) foundSection1 = true;
            if (chunk.content.includes("Section 2")) foundSection2 = true;
            if (chunk.content.includes("Section 3")) foundSection3 = true;
        }

        expect(foundMainTitle).toBe(true);
        expect(foundSection1).toBe(true);
        expect(foundSection2).toBe(true);
        expect(foundSection3).toBe(true);

        // Verify chunks don't overlap in position
        let isOrdered = true;
        for (let i = 1; i < result.length; i++) {
            if (result[i].startPosition <= result[i - 1].endPosition) {
                isOrdered = false;
                break;
            }
        }
        expect(isOrdered).toBe(true);
    });

    it("should handle long text with no obvious separator", () => {
        const longText = "x".repeat(500);
        const result = splitText(longText, 100);

        expect(result.length).toBe(5);

        for (let i = 0; i < result.length; i++) {
            const chunk = result[i];
            if (i < 4) {
                expect(chunk.content.length).toBe(100);
            } else {
                expect(chunk.content.length).toBe(100);
            }

            // Verify positions
            expect(chunk.startPosition).toBe(i * 100);
            expect(chunk.endPosition).toBe(chunk.startPosition + chunk.content.length - 1);
        }

        // Verify the reconstructed text
        const reconstructedText = result.map(chunk => chunk.content).join("");
        expect(reconstructedText).toBe(longText);
    });

    it("should allow perfect reconstruction of original text from chunks", () => {
        const complexText = "# Document Title\n\nThis is the first paragraph. It contains spaces and punctuation.\n\n## Section Alpha\nContent for alpha section. This section is short.\n\n## Section Beta\nThis section has content that will likely need to be split due to its length, especially if the chunk size is small. It also includes\na line break.\nAnd another line.\n\nThis is the second paragraph in Section Beta, following a double newline.\n\n## Section Gamma\nFinal section content. XXXXXXYYYYYYZZZZZZaaaaaabbbbbbccccccdddddddeeeeeefffffffggggggghhhhhhiiiiiiijjjjjjjkkkkkkklllllllmmmmmmmnnnnnnnooooooopppppppqqqqqqqqrrrrrrrsssssssstttttttuuuuuuuvvvvvvvwwwwwwwxxxxxxxyyyyyyyzzzzzzz.\n";
        const chunkSize = 75; // Choose a size likely to cause splitting
        const result = splitText(complexText, chunkSize);

        // Reconstruct the text by joining the content of all chunks
        const reconstructedText = result.map(chunk => chunk.content).join("");

        // Assert that the reconstructed text is identical to the original
        expect(reconstructedText).toBe(complexText);

        // Also verify that chunk positions are contiguous and cover the entire text
        let expectedStartPosition = 0;
        for (const chunk of result) {
            expect(chunk.startPosition).toBe(expectedStartPosition);
            expect(chunk.endPosition).toBe(chunk.startPosition + chunk.content.length - 1);
            expectedStartPosition = chunk.endPosition + 1;
        }
        expect(expectedStartPosition - 1).toBe(complexText.length - 1); // Check the last chunk ended correctly
    });
}); 