import { useRef, useEffect, useState } from "react";

import { TranscriberData } from "../hooks/useTranscriber";
import { formatAudioTimestamp, formatSrtTimeRange } from "../utils/AudioUtils";
import { formatForCopilot, splitForCopilot } from "../utils/CopilotExport";
import { PROMPT_TEMPLATES, formatTextWithPrompt } from "../utils/PromptTemplates";
import Modal from "./modal/Modal";
import { t } from "i18next";

interface Props {
    transcribedData: TranscriberData | undefined;
}

export default function Transcript({ transcribedData }: Props) {
    const divRef = useRef<HTMLDivElement>(null);
    const [showCopilotModal, setShowCopilotModal] = useState(false);
    const [selectedPromptId, setSelectedPromptId] = useState("none");

    const saveBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };
    const exportTXT = () => {
        const chunks = transcribedData?.chunks ?? [];
        const text = chunks
            .map((chunk) => chunk.text)
            .join("")
            .trim();

        const blob = new Blob([text], { type: "text/plain" });
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
        const chunks = transcribedData?.chunks ?? [];
        const text = chunks
            .map((chunk) => chunk.text)
            .join("")
            .trim();
        
        const template = PROMPT_TEMPLATES.find(t => t.id === selectedPromptId);
        const prompt = template && template.id !== "none" ? template.prompt : undefined;
        const copilotText = formatForCopilot(text, prompt);
        const blob = new Blob([copilotText], { type: "text/plain" });
        saveBlob(blob, "transcript-copilot.txt");
    };

    const exportButtons = [
        { name: "TXT", onClick: exportTXT },
        { name: "JSON", onClick: exportJSON },
        { name: "SRT", onClick: exportSRT },
        { name: "Copilot", onClick: () => setShowCopilotModal(true) },
    ];

    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "auto" });
    }, [transcribedData?.chunks]);

    return (
        <div
            ref={divRef}
            className='w-full flex flex-col mt-2 p-4 overflow-y-auto'
        >
            {transcribedData?.chunks &&
                transcribedData.chunks.map((chunk, i) => (
                    <div
                        key={`${i}-${chunk.text}`}
                        className={`w-full flex flex-row mb-2 ${transcribedData?.isBusy ? "bg-gray-100" : "bg-white"} rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10`}
                    >
                        <div className='mr-5'>
                            {formatAudioTimestamp(chunk.timestamp[0])}
                        </div>
                        {chunk.text}
                    </div>
                ))}
            {transcribedData && !transcribedData.isBusy && (
                <div className='w-full text-center'>
                    {exportButtons.map((button, i) => (
                        <button
                            key={i}
                            onClick={button.onClick}
                            className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center'
                        >
                            {t("transcript.export")} {button.name}
                        </button>
                    ))}
                </div>
            )}
            {transcribedData?.tps && (
                <p className='text-sm text-center mt-4'>
                    <span className='font-semibold text-black'>
                        {transcribedData?.tps.toFixed(2)}
                    </span>{" "}
                    <span className='text-gray-500'>
                        {t("transcript.tokens_per_second")}
                    </span>
                </p>
            )}
            <Modal
                show={showCopilotModal}
                submitEnabled={false}
                onClose={() => setShowCopilotModal(false)}
                title={t("transcript.copilot_title")}
                content={
                    <CopilotExportContent
                        transcribedData={transcribedData}
                        onClose={() => setShowCopilotModal(false)}
                        onExport={exportCopilot}
                        selectedPromptId={selectedPromptId}
                        onPromptChange={setSelectedPromptId}
                    />
                }
            />
            <div ref={endOfMessagesRef} />
        </div>
    );
}

function CopilotExportContent({
    transcribedData,
    onClose: closeModal,
    onExport,
    selectedPromptId,
    onPromptChange,
}: {
    transcribedData: TranscriberData | undefined;
    onClose: () => void;
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
