import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Create a custom OpenAI provider instance pointing to Groq's API
export const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});

// Export the google provider (Gemini)
// Note: @ai-sdk/google exports a helper 'google' directly, but we can also wrap it if needed for config.
// For now, we'll just re-export the standard one or configure it if we need specific settings.
import { google as googleProvider } from '@ai-sdk/google';
export const google = googleProvider;
