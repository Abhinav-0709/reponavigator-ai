import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText, ModelMessage } from 'ai';

export type AgentTask = 'MAP_REPO' | 'QUICK_EXPLAIN' | 'DEBUG_LOGIC';

export async function orchestrateAgent(
    task: AgentTask,
    messages: ModelMessage[]
) {
    // 1. Logic for choosing the model
    if (task === 'MAP_REPO') {
        return await callGeminiAgent(messages);
    }

    if (task === 'QUICK_EXPLAIN') {
        try {
            return await callGroqAgent(messages);
        } catch (e) {
            console.warn("Groq Limit hit, falling back to Gemini");
            return await callGeminiAgent(messages);
        }
    }

    throw new Error("Task agent not configured");
}

async function callGroqAgent(messages: ModelMessage[]) {
    // Note: Groq is OpenAI-compatible, so we use the openai provider 
    // but point it to the Groq base URL in your config or use a dedicated groq provider
    const { text, usage } = await generateText({
        model: openai('llama-3.1-8b-instant'),
        messages,
    });

    return { content: text, provider: 'Groq', tokensUsed: usage.totalTokens };
}

async function callGeminiAgent(messages: ModelMessage[]) {
    const { text, usage } = await generateText({
        model: google('gemini-2.5-flash'),
        messages,
    });

    return { content: text, provider: 'Gemini', tokensUsed: usage.totalTokens };
}