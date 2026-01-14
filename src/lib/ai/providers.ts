import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Create a custom OpenAI provider instance pointing to Groq's API
// We export a factory function to allow dynamic API keys (BYOK)
export const createGroq = (apiKey?: string) => createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: apiKey || process.env.GROQ_API_KEY,
});

// Export the google provider (Gemini) factory
export const createGoogle = (apiKey?: string) => createGoogleGenerativeAI({
    apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
