"use server";

import dbConnect from "@/lib/dbConnect";
import Repository from "@/models/Repository";
import { generateText } from "ai";
import { createGoogle } from "@/lib/ai/providers";

export async function compareRepos(repoId1: string, repoId2: string) {
    try {
        await dbConnect();

        const [repo1, repo2] = await Promise.all([
            Repository.findById(repoId1).lean(),
            Repository.findById(repoId2).lean()
        ]);

        if (!repo1 || !repo2) {
            throw new Error("One or both repositories not found.");
        }

        const prompt = `
            You are an expert Software Architect. Compare the following two repository architectures.

            ## Repository A: ${repo1.name} (${repo1.owner})
            ${repo1.architectureMap}

            ## Repository B: ${repo2.name} (${repo2.owner})
            ${repo2.architectureMap}

            ## Task:
            Generate a "Battle Report" comparing these two.
            1. **Tech Stack Face-off**: Compare languages, frameworks, and tools.
            2. **Architecture Comparison**: Strengths and weaknesses of each approach.
            3. **Use Case Verdict**: When should you use Repos A vs Repo B?

            Format as Markdown. Use emojis. Be concise but insightful.
        `;

        const { text } = await generateText({
            model: createGoogle()("gemini-2.5-flash"), // Using Pro for better reasoning on comparison
            prompt: prompt,
        });

        return { success: true, comparison: text };

    } catch (error: any) {
        console.error("Comparison Error:", error);
        return { success: false, error: error.message };
    }
}
