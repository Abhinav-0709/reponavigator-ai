import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        hasGroq: !!process.env.GROQ_API_KEY,
        hasGemini: !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY),
    });
}
