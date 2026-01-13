/**
 * Splits text into chunks suitable for Copilot (max 15000 characters)
 * Intelligently splits at sentence boundaries to preserve meaning
 */
export function splitForCopilot(text: string, maxChars: number = 15000): string[] {
    if (text.length <= maxChars) {
        return [text];
    }

    const chunks: string[] = [];
    let currentChunk = "";

    // Split by sentences (. ! ? followed by space)
    const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= maxChars) {
            currentChunk += sentence;
        } else {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Formats text chunks with Copilot instructions and optional prompt
 */
export function formatForCopilot(text: string, prompt?: string): string {
    const chunks = splitForCopilot(text);
    const totalChunks = chunks.length;

    if (totalChunks === 1) {
        if (prompt) {
            return `${prompt}\n\n${text}`;
        }
        return text;
    }

    const formatted = chunks
        .map((chunk, index) => {
            const header = `[Del ${index + 1}/${totalChunks}]`;
            if (index === 0 && prompt) {
                return `${prompt}\n\n${header}\n\n${chunk}`;
            }
            return `${header}\n\n${chunk}`;
        })
        .join("\n\n---\n\n");

    return formatted;
}

/**
 * Creates a dialog showing all chunks
 */
export function createCopilotDialog(text: string): {
    chunks: string[];
    totalChunks: number;
    formattedText: string;
} {
    const chunks = splitForCopilot(text);
    return {
        chunks,
        totalChunks: chunks.length,
        formattedText: formatForCopilot(text),
    };
}
