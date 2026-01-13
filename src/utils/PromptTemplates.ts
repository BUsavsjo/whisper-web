export interface PromptTemplate {
    id: string;
    name: string;
    nameKey: string;
    description: string;
    descriptionKey: string;
    prompt: string;
    promptKey: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
    {
        id: "none",
        name: "Ingen prompt",
        nameKey: "prompts.none.name",
        description: "Exportera endast transkriptionen",
        descriptionKey: "prompts.none.description",
        prompt: "",
        promptKey: "prompts.none.prompt",
    },
    {
        id: "structured_reflection",
        name: "📝 Strukturerad reflektion",
        nameKey: "prompts.structured_reflection.name",
        description: "För fri talad input som ska struktureras",
        descriptionKey: "prompts.structured_reflection.description",
        prompt: `Denna anteckning är baserad på fri talad input och ska struktureras till löpande text.

Läs den talade anteckningen nedan och sammanfatta innehållet som en reflekterande text. Identifiera eventuella åtgärdspunkter och ge texten en tydlig rubrik.

🗣️ Råtext:`,
        promptKey: "prompts.structured_reflection.prompt",
    },
    {
        id: "student_reflection",
        name: "👥 Samtalskompass",
        nameKey: "prompts.student_reflection.name",
        description: "För samtal och reflektioner",
        descriptionKey: "prompts.student_reflection.description",
        prompt: `Sammanfatta det som uttrycks i samtalet eller reflektionen. Lista vad som har genomförts, vad som upplevs som fungerande, eventuella utmaningar samt möjliga nästa steg. Utforma texten så att den kan användas som en strukturerad anteckning eller dokumentation.

📌 Struktur:
• Vad har personen arbetat med eller beskrivit?
• Vad fungerar bra enligt personen?
• Vad upplevs som utmanande eller behöver utvecklas?
• Vad kan göras som nästa steg?

🗣️ Fritt uttryckt innehåll:`,
        promptKey: "prompts.student_reflection.prompt",
    },
    {
        id: "summary",
        name: "📄 Sammanfattning",
        nameKey: "prompts.summary.name",
        description: "Skapa en kortfattad sammanfattning",
        descriptionKey: "prompts.summary.description",
        prompt: `Sammanfatta följande text i 3-5 punkter. Fokusera på de viktigaste budskapen och slutsatserna.

Text att sammanfatta:`,
        promptKey: "prompts.summary.prompt",
    },
    {
        id: "notes",
        name: "📋 Strukturerade anteckningar",
        nameKey: "prompts.notes.name",
        description: "Omvandla till redigerade anteckningar",
        descriptionKey: "prompts.notes.description",
        prompt: `Skapa strukturerade anteckningar från följande text. Använd rubriker, punktlistor och numrerade listor där det passar. Gör texten lättläst och välorganiserad.

Text:`,
        promptKey: "prompts.notes.prompt",
    },
    {
        id: "questions",
        name: "❓ Diskussionsfrågor",
        nameKey: "prompts.questions.name",
        description: "Generera diskussions- och reflektionsfrågor",
        descriptionKey: "prompts.questions.description",
        prompt: `Baserat på följande text, skapa 5 djupgående diskussionsfrågor som kan användas för reflektion eller grupparbete.

Text:`,
        promptKey: "prompts.questions.prompt",
    },
    {
        id: "keywords",
        name: "🎯 Nyckelord och begrepp",
        nameKey: "prompts.keywords.name",
        description: "Lista och definiera viktiga begrepp",
        descriptionKey: "prompts.keywords.description",
        prompt: `Lista 10 viktiga begrepp eller nyckelord från följande text och ge en kort definition eller förklaring av varje.

Text:`,
        promptKey: "prompts.keywords.prompt",
    },
];

export function getPromptTemplate(id: string): PromptTemplate | undefined {
    return PROMPT_TEMPLATES.find((template) => template.id === id);
}

export function formatTextWithPrompt(text: string, promptId: string): string {
    const template = getPromptTemplate(promptId);
    if (!template || template.id === "none") {
        return text;
    }
    return `${template.prompt}\n\n${text}`;
}
