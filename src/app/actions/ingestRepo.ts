"use server";

import dbConnect from "@/lib/dbConnect";
import Repository from "@/models/Repository";
import { getRepoStructure, getRepoDiff } from "@/lib/github/githubService";
import { createGoogle } from "@/lib/ai/providers";
import { generateText } from "ai";
import { revalidatePath } from "next/cache";
import UserHistory from "@/models/UserHistory";
import ActivityLog from "@/models/ActivityLog";
import { getRepoLanguages } from "@/lib/github/githubService";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function ingestRepo(url: string, apiKeys?: { google?: string }) {
    try {
        console.log("1. Connecting to DB...");
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

        console.log(`2. Fetching GitHub structure & languages for ${owner}/${repoName}...`);
        const [structureResult, languages] = await Promise.all([
            getRepoStructure(owner, repoName),
            getRepoLanguages(owner, repoName)
        ]);
        const { files: structure, hash: currentHash } = structureResult;

        // 🔍 CHECK CACHE & HASH
        const existingRepo = await Repository.findOne({ url: canonicalUrl }).lean();

        // If cached and hash matches, return (Smart Sync)
        if (existingRepo && existingRepo.status === 'completed' && existingRepo.lastCommitHash === currentHash) {
            console.log("⚡ Cache Hit (Hash Match)! Returning existing repo.");

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

            return {
                success: true,
                data: JSON.parse(JSON.stringify(existingRepo))
            };
        }

        let prompt = "";

        if (existingRepo && existingRepo.lastCommitHash) {
            const changedFiles = await getRepoDiff(owner, repoName, existingRepo.lastCommitHash, currentHash);
            console.log(`📉 Diff check: ${changedFiles.length} files changed.`);

            if (changedFiles.length > 0 && changedFiles.length < 20) {
                console.log("⚡ Minor Change detected. Running Differential Scan (Patch Update)...");
                prompt = `
                    You are updating an existing architecture summary for "${repoName}".

                    ### Current Summary:
                    ${existingRepo.architectureMap}

                    ### Changed Files:
                    ${changedFiles.join("\n")}

                    ### Task:
                    Update the summary to reflect these changes. Keep the structure identical. Do NOT rewrite unchanged parts.
                 `;
            } else {
                console.log("🔄 Major Change or First Run. Running Full Scan...");
                const fileList = structure.slice(0, 100).map(f => f.path).join("\n");
                prompt = `Analyze this file list for repo "${repoName}". What is the tech stack and architecture? \n\n ${fileList}`;
            }
        } else {
            // Fallback for first run or missing hash
            const fileList = structure.slice(0, 100).map(f => f.path).join("\n");
            prompt = `Analyze this file list for repo "${repoName}". What is the tech stack and architecture? \n\n ${fileList}`;
        }

        console.log(`3. Calling Gemini...`);

        // Using a try-catch specifically for the AI call
        let architectureSummary = "Summary generation failed.";
        try {
            const { text } = await generateText({
                model: createGoogle(apiKeys?.google)("gemini-2.5-flash"),
                // ✅ ADDING ABORT SIGNAL/TIMEOUT
                abortSignal: AbortSignal.timeout(60000), // 60 second limit
                prompt: prompt,
            });
            architectureSummary = text;
            console.log("4. Gemini responded successfully!");
        } catch (aiError) {
            console.error("❌ Gemini Call Failed:", aiError);
            architectureSummary = "The AI was unable to summarize this repo in time, but the files are indexed.";
        }

        console.log("5. Saving to MongoDB...");
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
            },
            { upsert: true, new: true }
        ).lean();

        if (userId) {
            // Track History
            await UserHistory.findOneAndUpdate(
                { userId, repository: newRepo._id },
                { lastVisited: new Date() },
                { upsert: true }
            );

            // Log Activity
            await ActivityLog.create({
                userId,
                action: "INGEST",
                details: `Analyzed repository ${owner}/${repoName}`,
                timestamp: new Date()
            });
        }

        console.log("6. Finished! Revalidating UI...");
        revalidatePath("/");
        return {
            success: true,
            data: JSON.parse(JSON.stringify(newRepo))
        };

    } catch (error: any) {
        console.error("❌ GLOBAL INGESTION ERROR:", error.message);
        return { success: false, error: error.message };
    }
}