"use server";

import dbConnect from "@/lib/dbConnect";
import Repository from "@/models/Repository";
import { getRepoStructure } from "@/lib/github/githubService";
import { createGoogle } from "@/lib/ai/providers";
import { generateText } from "ai";
import { revalidatePath } from "next/cache";

export async function ingestRepo(url: string, apiKeys?: { google?: string }) {
    try {
        console.log("1. Connecting to DB...");
        await dbConnect();

        const githubRegex = /github\.com\/([^/]+)\/([^/?#]+)/;
        const match = url.match(githubRegex);
        if (!match) throw new Error("Invalid URL");
        let [_, owner, repoName] = match;
        repoName = repoName.replace(/\.git$/, "");
        const canonicalUrl = `https://github.com/${owner}/${repoName}`;

        // 🔍 CHECK CACHE FIRST
        const existingRepo = await Repository.findOne({ url: canonicalUrl }).lean();
        if (existingRepo && existingRepo.status === 'completed') {
            console.log("⚡ Cache Hit! Returning existing repo.");
            return {
                success: true,
                data: JSON.parse(JSON.stringify(existingRepo))
            };
        }

        console.log(`2. Fetching GitHub structure for ${owner}/${repoName}...`);
        const structure = await getRepoStructure(owner, repoName);
        const fileList = structure.slice(0, 100).map(f => f.path).join("\n"); // 👈 Limited to 100 files for speed

        console.log(`3. Calling Gemini with ${structure.length} files...`);

        // Using a try-catch specifically for the AI call
        let architectureSummary = "Summary generation failed.";
        try {
            const { text } = await generateText({
                model: createGoogle(apiKeys?.google)("gemini-2.5-flash"),
                // ✅ ADDING ABORT SIGNAL/TIMEOUT
                abortSignal: AbortSignal.timeout(60000), // 60 second limit
                prompt: `Analyze this file list for repo "${repoName}". What is the tech stack and architecture? \n\n ${fileList}`,
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
                status: 'completed',
                lastAnalyzed: new Date(),
            },
            { upsert: true, new: true }
        ).lean();

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