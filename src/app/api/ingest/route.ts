import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Repository from "@/models/Repository";
import { getRepoStructure, getRepoDiff, getRepoLanguages } from "@/lib/github/githubService";
import { createGoogle } from "@/lib/ai/providers";
import { generateText } from "ai";
import UserHistory from "@/models/UserHistory";
import ActivityLog from "@/models/ActivityLog";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper to prioritize critical files for the AI Context
function rankFiles(files: string[]): string[] {
    const scores: Record<string, number> = {};

    const TIER_1_CRITICAL = [
        'package.json', 'go.mod', 'pom.xml', 'build.gradle', 'requirements.txt', 'Gemfile', // Dependency Manifests
        'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', // Containerization
        'README.md', 'README.txt', // Documentation
        'tsconfig.json', 'jsconfig.json', // Language Configs
        'next.config.js', 'next.config.mjs', 'vite.config.ts', 'webpack.config.js', // Framework Configs
    ];

    const TIER_2_ENTRYPTS = [
        'src/index.ts', 'src/main.ts', 'src/App.tsx', 'src/app/page.tsx', // TS/JS
        'main.go', 'cmd/main.go', // Go
        'src/main.rs', // Rust
        'app.py', 'main.py', // Python
        'index.html' // Web
    ];

    const TIER_3_CONFIG = [
        '.env.example', '.gitignore',
        'tailwind.config.ts', 'postcss.config.js',
    ];

    files.forEach(file => {
        let score = 0;
        const basename = file.split('/').pop() || '';

        // Exact matches
        if (TIER_1_CRITICAL.includes(basename)) score += 100;
        else if (TIER_2_ENTRYPTS.some(p => file.endsWith(p))) score += 80;
        else if (TIER_3_CONFIG.some(p => file.endsWith(p))) score += 50;

        // Pattern matches
        else if (file.startsWith('src/') || file.startsWith('app/') || file.startsWith('lib/')) score += 20; // Source code
        else if (file.includes('test') || file.includes('spec')) score -= 10; // Tests are less critical for high-level arch

        scores[file] = score;
    });

    return files.sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
}

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();
    const { url, apiKeys } = await req.json();

    const stream = new ReadableStream({
        async start(controller) {
            const sendUpdate = (data: any) => {
                controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
            };

            try {
                sendUpdate({ status: 'connecting', message: 'Connecting to database...' });
                await dbConnect();

                // 🔐 SECURE SESSION CHECK
                const session = await auth.api.getSession({
                    headers: await headers()
                });
                const userId = session?.user?.id;

                const githubRegex = /github\.com\/([^/]+)\/([^/?#]+)/;
                const match = url.match(githubRegex);
                if (!match) throw new Error("Invalid URL");
                let [_, owner, repoName] = match;
                repoName = repoName.replace(/\.git$/, "");
                const canonicalUrl = `https://github.com/${owner}/${repoName}`;

                sendUpdate({ status: 'fetching', message: `Fetching ${owner}/${repoName} from GitHub...` });
                const [structureResult, languages] = await Promise.all([
                    getRepoStructure(owner, repoName),
                    getRepoLanguages(owner, repoName)
                ]);
                const { files: structure, hash: currentHash } = structureResult;

                // 🔍 CHECK CACHE & HASH
                const existingRepo = await Repository.findOne({ url: canonicalUrl }).lean();

                // If cached and hash matches, return (Smart Sync)
                if (existingRepo && existingRepo.status === 'completed' && existingRepo.lastCommitHash === currentHash) {
                    sendUpdate({ status: 'found', message: 'Cache hit! Returning existing data.' });

                    if (userId) {
                        await UserHistory.findOneAndUpdate(
                            { userId, repository: existingRepo._id },
                            { lastVisited: new Date() },
                            { upsert: true }
                        );

                        await ActivityLog.create({
                            userId,
                            action: "VIEW",
                            details: `Revisited ${existingRepo.owner}/${existingRepo.name}`,
                            timestamp: new Date()
                        });
                    }

                    sendUpdate({ success: true, data: JSON.parse(JSON.stringify(existingRepo)) });
                    controller.close();
                    return;
                }

                let prompt = "";

                // SMART CONTEXT SELECTION
                sendUpdate({ status: 'ranking', message: 'Ranking files with Smart Context...' });
                const allPaths = structure.map(f => f.path);
                const rankedFiles = rankFiles(allPaths);
                const topFiles = rankedFiles.slice(0, 100);
                const fileList = topFiles.join("\n");

                sendUpdate({ status: 'analyzing', message: 'Consulting the Architect (Gemini)...' });

                if (existingRepo && existingRepo.lastCommitHash) {
                    const changedFiles = await getRepoDiff(owner, repoName, existingRepo.lastCommitHash, currentHash);

                    if (changedFiles.length > 0 && changedFiles.length < 20) {
                        prompt = `
                            You are updating an existing architecture summary for "${repoName}".

                            ### Current Summary:
                            ${existingRepo.architectureMap}

                            ### Changed Files:
                            ${changedFiles.join("\n")}

                            ### Task:
                            Update the summary to reflect these changes. Keep the structure identical. Do NOT rewrite unchanged parts.
                            
                            IMPORTANT: If the architecture has changed significantly, update the Mermaid diagram.
                            - Use \`\`\`mermaid\`\`\` code blocks.
                            - Do NOT use special characters (spaces, quotes) in node IDs.
                            - Use double quotes for labels, but escape internal quotes (e.g., "Label with \\"quote\\"").
                        `;
                    } else {
                        prompt = `
                            Analyze this file list for repo "${repoName}". 
                            
                            1. Describe the tech stack and architecture.
                            2. Generate a high-level system architecture diagram using Mermaid.js syntax.
                               - Use \`\`\`mermaid\`\`\` code blocks.
                               - Use 'graph TD' or 'graph LR'.
                               - Do NOT use special characters (like spaces or brackets) in node IDs (e.g., use 'Client' instead of 'Client[Browser]').
                               - Use double quotes for node labels (e.g., A["Client Browser"]).
                            
                            File List:
                            ${fileList}
                        `;
                    }
                } else {
                    prompt = `
                        Analyze this file list for repo "${repoName}". 
                        
                        1. Describe the tech stack and architecture.
                        2. Generate a high-level system architecture diagram using Mermaid.js syntax.
                           - Use \`\`\`mermaid\`\`\` code blocks.
                           - Use 'graph TD' or 'graph LR'.
                           - Do NOT use special characters in node IDs.
                           - Use double quotes for node labels.

                        File List:
                        ${fileList}
                    `;
                }

                // Using a try-catch specifically for the AI call
                let architectureSummary = "Summary generation failed.";
                let tokenUsage = 0;

                try {
                    const { text, usage } = await generateText({
                        model: createGoogle(apiKeys?.google)("gemini-2.5-flash"),
                        abortSignal: AbortSignal.timeout(60000), // 60 second limit
                        prompt: prompt,
                    });
                    architectureSummary = text;
                    tokenUsage = usage?.totalTokens || 0;
                } catch (aiError) {
                    console.error("❌ Gemini Call Failed:", aiError);
                    architectureSummary = "The AI was unable to summarize this repo in time, but the files are indexed.";
                }

                sendUpdate({ status: 'saving', message: 'Saving to MongoDB...' });
                const newRepo = await Repository.findOneAndUpdate(
                    { url: canonicalUrl },
                    {
                        name: repoName,
                        owner: owner,
                        architectureMap: architectureSummary,
                        languages: languages,
                        status: 'completed',
                        lastAnalyzed: new Date(),
                        lastCommitHash: currentHash,
                        tokenUsage: tokenUsage,
                    },
                    { upsert: true, new: true }
                ).lean();

                if (userId) {
                    await UserHistory.findOneAndUpdate(
                        { userId, repository: newRepo._id },
                        { lastVisited: new Date() },
                        { upsert: true }
                    );

                    await ActivityLog.create({
                        userId,
                        action: "INGEST",
                        details: `Analyzed repository ${owner}/${repoName}`,
                        timestamp: new Date()
                    });
                }

                sendUpdate({ status: 'complete', message: 'Done!' });
                sendUpdate({ success: true, data: JSON.parse(JSON.stringify(newRepo)) });
                controller.close();

            } catch (error: any) {
                console.error("❌ GLOBAL INGESTION ERROR:", error.message);
                sendUpdate({ success: false, error: error.message });
                controller.close();
            }
        }
    });

    return new NextResponse(stream, {
        headers: { 'Content-Type': 'text/event-stream' }
    });
}
