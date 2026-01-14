import { useRef, useEffect, useState } from "react";

import { TranscriberData } from "../hooks/useTranscriber";
import { formatAudioTimestamp, formatSrtTimeRange } from "../utils/AudioUtils";
import { formatForCopilot, splitForCopilot } from "../utils/CopilotExport";
import { PROMPT_TEMPLATES } from "../utils/PromptTemplates";
import Modal from "./modal/Modal";
import { t } from "i18next";

interface Props {
    transcribedData: TranscriberData | undefined;
}

export default function Transcript({ transcribedData }: Props) {
    const divRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showCopilotModal, setShowCopilotModal] = useState(false);
    const [selectedPromptId, setSelectedPromptId] = useState("none");
    const [editedText, setEditedText] = useState("");
    const [showTextColumn, setShowTextColumn] = useState(true);

    const saveBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };
    const exportTXT = () => {
        const textToExport = (editedText || fullText).trim();
        const blob = new Blob([textToExport], { type: "text/plain" });
        saveBlob(blob, "transcript.txt");
    };
    const exportJSON = () => {
        let jsonData = JSON.stringify(transcribedData?.chunks ?? [], null, 2);

        // post-process the JSON to make it more readable
        const regex = /( {4}"timestamp": )\[\s+(\S+)\s+(\S+)\s+\]/gm;
        jsonData = jsonData.replace(regex, "$1[$2 $3]");

        const blob = new Blob([jsonData], { type: "application/json" });
        saveBlob(blob, "transcript.json");
    };
    const exportSRT = () => {
        const chunks = transcribedData?.chunks ?? [];
        let srt = "";
        for (let i = 0; i < chunks.length; i++) {
            srt += `${i + 1}\n`;
            // TODO - Check why 2nd timestamp is number | null
            srt += `${formatSrtTimeRange(chunks[i].timestamp[0], chunks[i].timestamp[1] ?? chunks[i].timestamp[0])}\n`;
            srt += `${chunks[i].text}\n\n`;
        }
        const blob = new Blob([srt], { type: "text/plain" });
        saveBlob(blob, "transcript.srt");
    };

    const exportCopilot = () => {
        const text = (editedText || fullText).trim();
        const template = PROMPT_TEMPLATES.find(t => t.id === selectedPromptId);
        const prompt = template && template.id !== "none" ? template.prompt : undefined;
        const copilotText = formatForCopilot(text, prompt);
        const blob = new Blob([copilotText], { type: "text/plain" });
        saveBlob(blob, "transcript-copilot.txt");
    };

    const exportButtons = [
        { name: "som text (TXT)", onClick: exportTXT },
        { name: "strukturerad data (JSON)", onClick: exportJSON },
        { name: "tidsstämplar (SRT)", onClick: exportSRT },
        { name: "för Copilot / valfri AI", onClick: () => setShowCopilotModal(true) },
    ];

    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "auto" });
    }, [transcribedData?.chunks]);

    useEffect(() => {
        const chunks = transcribedData?.chunks ?? [];
        const text = chunks.map((chunk) => chunk.text).join("").trim();
        setEditedText(text);
    }, [transcribedData?.chunks]);

    const chunks = transcribedData?.chunks ?? [];
    const fullText = chunks.map((chunk) => chunk.text).join("").trim();

    const restoreToTranscript = () => {
        setEditedText(fullText);
    };

    const insertPrompt = (templateId: string) => {
        const template = PROMPT_TEMPLATES.find(t => t.id === templateId);
        if (!template || template.id === "none") return;
        
        const promptText = template.prompt + "\n\n";
        setEditedText(promptText + editedText);
        
        // Focus textarea after insertion
        requestAnimationFrame(() => {
            textareaRef.current?.focus();
        });
    };

    const copyEditedText = () => {
        const textToCopy = editedText.trim();
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Text kopierad till urklipp!');
        }).catch(err => {
            console.error('Kunde inte kopiera text:', err);
        });
    };

    const wrapSelection = (prefix: string, suffix?: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const sfx = suffix ?? prefix;
        const before = editedText.slice(0, start);
        const sel = editedText.slice(start, end);
        const after = editedText.slice(end);
        const next = `${before}${prefix}${sel}${sfx}${after}`;
        setEditedText(next);
        // restore selection around original selection including wrappers
        requestAnimationFrame(() => {
            const pos = start + prefix.length + sel.length + sfx.length;
            ta.focus();
            ta.setSelectionRange(pos, pos);
        });
    };

    const prefixLines = (prefix: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        // Expand to full lines
        const beforeText = editedText.slice(0, start);
        const lineStart = beforeText.lastIndexOf("\n") + 1; // -1 => 0
        const pre = editedText.slice(0, lineStart);
        const middle = editedText.slice(lineStart, end).split("\n").map(l => (l ? `${prefix}${l}` : `${prefix}`)).join("\n");
        const post = editedText.slice(end);
        const next = `${pre}${middle}${post}`;
        setEditedText(next);
        requestAnimationFrame(() => {
            ta.focus();
        });
    };

    return (
        <div ref={divRef} className='w-full flex flex-col mt-2 h-full overflow-hidden'>
            {/* Mobile: No tabs needed, just show workspace */}

            {/* Desktop: Side-by-side layout */}
            <div className='hidden md:flex flex-1 overflow-hidden'>
                {/* Left column: Text */}
                {showTextColumn && (
                <div className='w-1/2 border-r border-gray-200 overflow-y-auto p-4 md:p-6 bg-white'>
                    <div className='flex flex-col gap-3 mb-4'>
                        <div className='flex items-center justify-between'>
                            <h2 className='text-xl md:text-2xl font-bold text-gray-800'>{t("transcript.title")}</h2>
                            <button
                                onClick={() => setShowTextColumn(false)}
                                className='text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                            >
                                Dölj
                            </button>
                        </div>
                        <div className='flex flex-wrap items-center gap-1.5'>
                                <button
                                    onClick={() => wrapSelection("**")}
                                    title='Fetstil'
                                    className='text-xs md:text-sm px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50'
                                >
                                    B
                                </button>
                                <button
                                    onClick={() => wrapSelection("*")}
                                    title='Kursiv'
                                    className='text-xs md:text-sm px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50'
                                >
                                    I
                                </button>
                                <button
                                    onClick={() => prefixLines("• ")}
                                    title='Punktlista'
                                    className='text-xs md:text-sm px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50'
                                >
                                    •
                                </button>
                                <button
                                    onClick={restoreToTranscript}
                                    title='Återställ till transkriberad text'
                                    className='text-xs md:text-sm px-2 py-1 rounded border border-red-300 text-red-700 bg-white hover:bg-red-50'
                                >
                                    Återställ
                                </button>
                            </div>
                    </div>
                    <div className='max-w-3xl mx-auto prose prose-sm'>
                        <>
                        <textarea
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                ref={textareaRef}
                                spellCheck={true}
                                lang='sv'
                                wrap='soft'
                                className='w-full h-[300px] border border-gray-300 rounded-md p-3 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-y-scroll'
                            />
                            <div className='mt-4'>
                                <h3 className='text-base md:text-lg font-semibold mb-2 md:mb-3 text-gray-700'>{t("transcript.copilot_prompt_title")}</h3>
                                <div className='flex flex-wrap gap-1.5 md:gap-2'>
                                    {PROMPT_TEMPLATES.filter(t => t.id !== "none").map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => insertPrompt(template.id)}
                                            className='text-white bg-purple-500 hover:bg-purple-600 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-xs md:text-sm px-2.5 md:px-4 py-1.5 md:py-2'
                                        >
                                            ➕ {template.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className='mt-4'>
                                <h3 className='text-base md:text-lg font-semibold mb-2 md:mb-3 text-gray-700'>{t("transcript.copy_result_title")}</h3>
                                <button
                                    onClick={copyEditedText}
                                    className='text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs md:text-sm px-2.5 md:px-4 py-1.5 md:py-2 text-center'
                                >
                                    📋 Kopiera hela texten
                                </button>
                            </div>
                            </>
                    </div>
                    <div ref={endOfMessagesRef} />
                </div>
                )}

                {/* Right column: Workspace */}
                <div className={`${showTextColumn ? 'w-1/2' : 'w-full'} overflow-y-auto p-6 bg-gray-50 relative`}>
                    {!showTextColumn && (
                        <button
                            onClick={() => setShowTextColumn(true)}
                            title='Visa skrivyta'
                            className='absolute top-4 right-4 text-sm px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 shadow-sm z-10'
                        >
                            📄 Skrivyta
                        </button>
                    )}
                    <h2 className='text-2xl font-bold mb-6 text-gray-800'>{t("transcript.workspace_title")}</h2>
                    
                    {/* Export buttons */}
                    {transcribedData && !transcribedData.isBusy && (
                        <div className='mb-6'>
                            <h3 className='text-lg font-semibold mb-3 text-gray-700'>{t("transcript.export_title")}</h3>
                            <div className='flex flex-wrap gap-2'>
                                {exportButtons.map((button, i) => (
                                    <button
                                        key={i}
                                        onClick={button.onClick}
                                        className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center'
                                    >
                                        {t("transcript.export")} {button.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chunks with timestamps */}
                    <div className='mb-6'>
                        <h3 className='text-lg font-semibold mb-3 text-gray-700'>{t("transcript.timestamps_title")}</h3>
                        <div className='space-y-2'>
                            {transcribedData?.chunks &&
                                transcribedData.chunks.map((chunk, i) => (
                                    <div
                                        key={`${i}-${chunk.text}`}
                                        className={`flex flex-row p-3 rounded-lg ${
                                            transcribedData?.isBusy ? "bg-gray-100" : "bg-white"
                                        } shadow-sm ring-1 ring-slate-700/10`}
                                    >
                                        <div className='mr-4 text-sm font-mono text-gray-500 flex-shrink-0'>
                                            {formatAudioTimestamp(chunk.timestamp[0])}
                                        </div>
                                        <div className='text-sm text-gray-700'>{chunk.text}</div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Performance stats */}
                    {transcribedData?.tps && (
                        <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
                            <p className='text-sm text-center'>
                                <span className='font-semibold text-blue-900'>
                                    {transcribedData?.tps.toFixed(2)}
                                </span>{" "}
                                <span className='text-blue-700'>
                                    {t("transcript.tokens_per_second")}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile: Workspace only */}
            <div className='md:hidden flex-1 overflow-y-auto'>
                <div className='p-4 bg-gray-50'>
                    <h2 className='text-xl font-bold mb-4 text-gray-800'>Arbetsyta</h2>

                        {transcribedData && !transcribedData.isBusy && (
                            <div className='mb-6'>
                                <h3 className='text-base font-semibold mb-3 text-gray-700'>Exportera</h3>
                                <div className='flex flex-wrap gap-2'>
                                    {exportButtons.map((button, i) => (
                                        <button
                                            key={i}
                                            onClick={button.onClick}
                                            className='text-white bg-green-500 hover:bg-green-600 font-medium rounded-lg text-sm px-4 py-2'
                                        >
                                            {t("transcript.export")} {button.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='mb-6'>
                            <h3 className='text-base font-semibold mb-3 text-gray-700'>{t("transcript.timestamps_title")}</h3>
                            <div className='space-y-2'>
                                {transcribedData?.chunks &&
                                    transcribedData.chunks.map((chunk, i) => (
                                        <div
                                            key={`${i}-${chunk.text}`}
                                            className='flex flex-col p-3 bg-white rounded-lg shadow-sm ring-1 ring-slate-700/10'
                                        >
                                            <div className='text-xs font-mono text-gray-500 mb-1'>
                                                {formatAudioTimestamp(chunk.timestamp[0])}
                                            </div>
                                            <div className='text-sm text-gray-700'>{chunk.text}</div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {transcribedData?.tps && (
                            <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
                                <p className='text-sm text-center'>
                                    <span className='font-semibold text-blue-900'>
                                        {transcribedData?.tps.toFixed(2)}
                                    </span>{" "}
                                    <span className='text-blue-700'>
                                        {t("transcript.tokens_per_second")}
                                    </span>
                                </p>
                            </div>
                        )}
                </div>
            </div>

            <Modal
                show={showCopilotModal}
                submitEnabled={false}
                onClose={() => setShowCopilotModal(false)}
                title={t("transcript.copilot_title")}
                content={
                    <CopilotExportContent
                        transcribedData={transcribedData}
                        onExport={exportCopilot}
                        selectedPromptId={selectedPromptId}
                        onPromptChange={setSelectedPromptId}
                    />
                }
            />
        </div>
    );
}

function CopilotExportContent({
    transcribedData,
    onExport,
    selectedPromptId,
    onPromptChange,
}: {
    transcribedData: TranscriberData | undefined;
    onExport: () => void;
    selectedPromptId: string;
    onPromptChange: (promptId: string) => void;
}) {
    const chunks = transcribedData?.chunks ?? [];
    const text = chunks
        .map((chunk) => chunk.text)
        .join("")
        .trim();

    const selectedTemplate = PROMPT_TEMPLATES.find(t => t.id === selectedPromptId);
    const prompt = selectedTemplate && selectedTemplate.id !== "none" ? selectedTemplate.prompt : undefined;
    const copilotChunks = splitForCopilot(text);
    const totalChunks = copilotChunks.length;

    const copyToClipboard = async () => {
        const formattedText = formatForCopilot(text, prompt);
        try {
            await navigator.clipboard.writeText(formattedText);
            alert(t("transcript.copilot_copied"));
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className='w-full'>
            <p className='mb-4 text-sm'>
                {t("transcript.copilot_description")}
            </p>

            {/* Prompt Template Selector */}
            <div className='mb-4'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    📝 {t("transcript.prompt_template")}
                </label>
                <select
                    value={selectedPromptId}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                >
                    {PROMPT_TEMPLATES.map((template) => (
                        <option key={template.id} value={template.id}>
                            {template.name}
                        </option>
                    ))}
                </select>
                {selectedTemplate && selectedTemplate.id !== "none" && (
                    <p className='mt-2 text-xs text-gray-600 italic'>
                        {selectedTemplate.description}
                    </p>
                )}
            </div>

            {/* Prompt Preview */}
            {prompt && (
                <div className='bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4'>
                    <p className='text-sm font-semibold text-purple-900 mb-2'>
                        📋 {t("transcript.prompt_preview")}
                    </p>
                    <pre className='text-xs text-purple-800 whitespace-pre-wrap'>
                        {prompt}
                    </pre>
                </div>
            )}

            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
                <p className='text-sm font-semibold text-blue-900 mb-2'>
                    {t("transcript.copilot_info")}
                </p>
                <ul className='text-sm text-blue-800 list-disc list-inside'>
                    <li>
                        {t("transcript.copilot_total_parts")}: <strong>{totalChunks}</strong>
                    </li>
                    <li>
                        {t("transcript.copilot_max_chars")}: <strong>15 000</strong>
                    </li>
                </ul>
            </div>

            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto'>
                <p className='text-sm font-semibold text-gray-700 mb-2'>
                    {t("transcript.copilot_preview")}
                </p>
                <div className='text-xs text-gray-600 space-y-2'>
                    {copilotChunks.slice(0, 2).map((chunk, index) => (
                        <div
                            key={index}
                            className='pb-2 border-b border-gray-300'
                        >
                            <p className='font-semibold text-gray-700 mb-1'>
                                [{t("transcript.copilot_part")} {index + 1}/{totalChunks}]
                            </p>
                            <p>{chunk.substring(0, 150)}...</p>
                        </div>
                    ))}
                    {totalChunks > 2 && (
                        <p className='text-gray-500 italic'>
                            + {totalChunks - 2} {t("transcript.copilot_more_parts")}
                        </p>
                    )}
                </div>
            </div>

            <div className='flex gap-2'>
                <button
                    onClick={copyToClipboard}
                    className='flex-1 text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2'
                >
                    📋 {t("transcript.copilot_copy")}
                </button>
                <button
                    onClick={onExport}
                    className='flex-1 text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2'
                >
                    💾 {t("transcript.copilot_download")}
                </button>
            </div>

            <p className='text-xs text-gray-500 mt-4'>
                {t("transcript.copilot_usage_tip")}
            </p>
        </div>
    );
}
