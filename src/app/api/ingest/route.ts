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

// --- HELPERS ---

function rankFiles(files: string[]): string[] {
    const scores: Record<string, number> = {};

    const TIER_1_CRITICAL = [
        'package.json', 'go.mod', 'pom.xml', 'build.gradle', 'requirements.txt', 'Gemfile',
        'Dockerfile', 'docker-compose.yml', 'README.md', 'tsconfig.json', 'next.config.js'
    ];

    const TIER_2_ENTRYPTS = ['src/index.ts', 'src/main.ts', 'src/app/page.tsx', 'main.go', 'app.py'];

    files.forEach(file => {
        let score = 0;
        const basename = file.split('/').pop() || '';
        if (TIER_1_CRITICAL.includes(basename)) score += 100;
        else if (TIER_2_ENTRYPTS.some(p => file.endsWith(p))) score += 80;
        else if (file.startsWith('src/') || file.startsWith('app/') || file.startsWith('lib/')) score += 20;
        else if (file.includes('test') || file.includes('spec')) score -= 10;
        scores[file] = score;
    });

    return files.sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
}

// --- MAIN ROUTE ---

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

                const session = await auth.api.getSession({ headers: await headers() });
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

                const existingRepo = await Repository.findOne({ url: canonicalUrl }).lean();

                // SMART CACHE & SYNC CHECK
                if (existingRepo && existingRepo.status === 'completed' && existingRepo.lastCommitHash === currentHash) {
                    sendUpdate({ status: 'found', message: 'Cache hit! Syncing history...' });
                    if (userId) {
                        await Promise.all([
                            UserHistory.findOneAndUpdate({ userId, repository: existingRepo._id }, { lastVisited: new Date() }, { upsert: true }),
                            ActivityLog.create({ userId, action: "VIEW", details: `Revisited ${existingRepo.owner}/${existingRepo.name}`, timestamp: new Date() })
                        ]);
                    }
                    sendUpdate({ success: true, data: JSON.parse(JSON.stringify(existingRepo)) });
                    controller.close();
                    return;
                }

                // CONTEXT PREPARATION
                sendUpdate({ status: 'ranking', message: 'Ranking files with Smart Context...' });
                const allPaths = structure.map(f => f.path);
                const fileList = rankFiles(allPaths).slice(0, 100).join("\n");

                const devOpsFiles = allPaths.filter(p =>
                    /Dockerfile|docker-compose|kubernetes|k8s|helm|\.tf|terraform|fly\.toml|wrangler\.toml|.github\/workflows|vercel\.json|netlify\.toml/.test(p)
                );
                console.log("🔍 DevOps Files Detected:", devOpsFiles);

                // PROMPT LOGIC
                let archPrompt = "";
                if (existingRepo && existingRepo.lastCommitHash) {
                    const changedFiles = await getRepoDiff(owner, repoName, existingRepo.lastCommitHash, currentHash);
                    archPrompt = `Update architecture summary for "${repoName}". Current: ${existingRepo.architectureMap}. Changes: ${changedFiles.join("\n")}. Keep structure, update Mermaid if needed. Use \`\`\`mermaid\`\`\` blocks. No special chars in node IDs.`;
                } else {
                    archPrompt = `Analyze "${repoName}". 1. Describe tech stack/architecture. 2. Generate high-level Mermaid.js diagram (graph TD). Use double quotes for labels. Files:\n${fileList}`;
                }

                const devOpsPrompt = `
                    You are a Senior DevOps Engineer. Analyze: "${repoName}".
                    
                    Repo Files Context: ${devOpsFiles.join(", ")}

                    Task: Create a **concise, actionable Deployment Guide**.
                    
                    Required Sections:
                    1. **🚀 Build & Run**: Exact commands (e.g., Docker run).
                    2. **🌐 Environment**: Key variables (PORT, DB_URL).
                    3. **🛡️ Security**: 1-2 critical risks.
                    4. **🔄 CI/CD**: Quick pipeline strategy.

                    Constraint: Stop after 500 words. Be direct.
                `;

                // --- PARALLEL AGENT EXECUTION ---
                sendUpdate({ status: 'analyzing', message: 'Orchestrating AI Agents...' });

                const aiModel = createGoogle(apiKeys?.google)("gemini-2.5-flash"); // Upgraded to 2.0

                const [archResult, devOpsResult] = await Promise.all([
                    generateText({
                        model: aiModel,
                        abortSignal: AbortSignal.timeout(60000),
                        prompt: archPrompt,
                    }),
                    devOpsFiles.length > 0
                        ? (console.log("🚀 Starting DevOps Agent..."), generateText({
                            model: aiModel,
                            abortSignal: AbortSignal.timeout(60000),
                            prompt: devOpsPrompt,
                        }))
                        : (console.log("⚠️ No DevOps files found, skipping agent."), Promise.resolve({ text: "", usage: { totalTokens: 0 } }))
                ]);

                const architectureSummary = archResult.text;
                const devopsReport = devOpsResult.text;
                const totalTokens = (archResult.usage?.totalTokens || 0) + (devOpsResult.usage?.totalTokens || 0);

                // --- PERSISTENCE ---
                sendUpdate({ status: 'saving', message: 'Saving to MongoDB...' });
                const updatedRepo = await Repository.findOneAndUpdate(
                    { url: canonicalUrl },
                    {
                        name: repoName,
                        owner,
                        architectureMap: architectureSummary,
                        devopsReport: devopsReport,
                        languages,
                        status: 'completed',
                        lastAnalyzed: new Date(),
                        lastCommitHash: currentHash,
                        tokenUsage: totalTokens,
                    },
                    { upsert: true, new: true }
                ).lean();

                if (userId) {
                    await Promise.all([
                        UserHistory.findOneAndUpdate({ userId, repository: updatedRepo._id }, { lastVisited: new Date() }, { upsert: true }),
                        ActivityLog.create({ userId, action: "INGEST", details: `Analyzed ${owner}/${repoName}`, timestamp: new Date() })
                    ]);
                }

                sendUpdate({ status: 'complete', message: 'Analysis Finished!' });
                sendUpdate({ success: true, data: JSON.parse(JSON.stringify(updatedRepo)) });
                controller.close();

            } catch (error: any) {
                console.error("❌ INGESTION ERROR:", error.message);
                sendUpdate({ success: false, error: error.message });
                controller.close();
            }
        }
    });

    return new NextResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}