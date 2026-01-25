import { pipeline, WhisperTextStreamer } from "@huggingface/transformers";

// Define model factories
// Ensures only one model is created of each type
class PipelineFactory {
    static task = null;
    static model = null;
    static dtype = null;
    static gpu = false;
    static instance = null;

    constructor(tokenizer, model, dtype, gpu) {
        this.tokenizer = tokenizer;
        this.model = model;
        this.dtype = dtype;
        this.gpu = gpu;
    }

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, {
                dtype: this.dtype,
                device: this.gpu ? "webgpu" : "wasm",
                progress_callback,
            });
        }

        return this.instance;
    }
}

self.addEventListener("message", async (event) => {
    const message = event.data;

    // Do some work...
    // TODO use message data
    let transcript = await transcribe(message);
    if (transcript === null) return;

    // Send the result back to the main thread
    self.postMessage({
        status: "complete",
        data: transcript,
    });
});

class AutomaticSpeechRecognitionPipelineFactory extends PipelineFactory {
    static task = "automatic-speech-recognition";
    static model = null;
    static dtype = null;
    static gpu = false;
}

const transcribe = async ({ audio, model, dtype, gpu, subtask, language }) => {
    const isDistilWhisper = model.startsWith("distil-whisper/");

    const p = AutomaticSpeechRecognitionPipelineFactory;
    if (p.model !== model || p.dtype !== dtype || p.gpu !== gpu) {
        // Invalidate model if different model, dtype, or gpu setting
        p.model = model;
        p.dtype = dtype;
        p.gpu = gpu;

        if (p.instance !== null) {
            (await p.getInstance()).dispose();
            p.instance = null;
        }
    }

    // Load transcriber model
    const transcriber = await p.getInstance((data) => {
        self.postMessage(data);
    });

    const time_precision =
        transcriber.processor.feature_extractor.config.chunk_length /
        transcriber.model.config.max_source_positions;

    // Storage for chunks to be processed. Initialise with an empty chunk.
    /** @type {{ text: string; offset: number, timestamp: [number, number | null] }[]} */
    const chunks = [];
    const mergedChunks = [];

    const chunk_length_s = isDistilWhisper ? 20 : 30;
    const stride_length_s = isDistilWhisper ? 3 : 5;

    let chunk_count = 0;
    let start_time;
    let num_tokens = 0;
    let tps;
    const streamer = new WhisperTextStreamer(transcriber.tokenizer, {
        time_precision,
        on_chunk_start: (x) => {
            const offset = (chunk_length_s - stride_length_s) * chunk_count;
            chunks.push({
                text: "",
                timestamp: [offset + x, null],
                finalised: false,
                offset,
            });
        },
        token_callback_function: (x) => {
            start_time ??= performance.now();
            if (num_tokens++ > 0) {
                tps = (num_tokens / (performance.now() - start_time)) * 1000;
            }
        },
        callback_function: (x) => {
            if (chunks.length === 0) return;
            // Append text to the last chunk
            chunks.at(-1).text += x;

            // Send merged chunks to avoid showing duplicates
            const displayChunks = [...mergedChunks];
            const lastChunk = chunks.at(-1);
            
            // Add the current chunk being processed if it doesn't overlap
            if (mergedChunks.length === 0) {
                displayChunks.push(lastChunk);
            } else {
                const lastMerged = mergedChunks.at(-1);
                const lastMergedEnd = lastMerged.timestamp[1] || lastMerged.timestamp[0];
                
                if (lastChunk.timestamp[0] >= lastMergedEnd) {
                    displayChunks.push(lastChunk);
                }
            }

            self.postMessage({
                status: "update",
                data: {
                    text: "", // No need to send full text yet
                    chunks: displayChunks,
                    tps,
                },
            });
        },
        on_chunk_end: (x) => {
            const current = chunks.at(-1);
            current.timestamp[1] = x + current.offset;
            current.finalised = true;
            
            // Merge finalized chunks, removing overlaps
            if (mergedChunks.length === 0) {
                // First chunk, add it directly
                mergedChunks.push({ ...current });
            } else {
                const lastMerged = mergedChunks.at(-1);
                const overlapStart = current.offset;
                const lastMergedEnd = lastMerged.timestamp[1];
                
                // Only add the non-overlapping part
                if (overlapStart < lastMergedEnd) {
                    // There's an overlap, skip the overlapping part
                    const nonOverlapStart = lastMergedEnd;
                    if (nonOverlapStart < current.timestamp[1]) {
                        mergedChunks.push({
                            text: current.text,
                            timestamp: [nonOverlapStart, current.timestamp[1]],
                            finalised: true,
                            offset: current.offset
                        });
                    }
                } else {
                    // No overlap, add the chunk as is
                    mergedChunks.push({ ...current });
                }
            }
        },
        on_finalize: () => {
            start_time = null;
            num_tokens = 0;
            ++chunk_count;
        },
    });

    // Actually run transcription
    const output = await transcriber(audio, {
        // Greedy
        top_k: 0,
        do_sample: false,

        // Sliding window
        chunk_length_s,
        stride_length_s,

        // Language and task
        language,
        task: subtask,

        // Return timestamps
        return_timestamps: true,
        force_full_sequences: false,

        // Callback functions
        streamer, // after each generation step
    }).catch((error) => {
        console.error(error);
        self.postMessage({
            status: "error",
            data: error,
        });
        return null;
    });

    return {
        tps,
        ...output,
    };
};
