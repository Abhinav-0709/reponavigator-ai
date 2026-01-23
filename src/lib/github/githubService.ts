import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export interface FileNode {
    path: string;
    type: "blob" | "tree";
    size?: number;
}

export async function getRepoStructure(owner: string, repo: string): Promise<FileNode[]> {
    try {
        // 1. Get the default branch (usually 'main' or 'master')
        const { data: repository } = await octokit.rest.repos.get({ owner, repo });
        const defaultBranch = repository.default_branch;

        // 2. Fetch the full recursive tree
        const { data: treeData } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: defaultBranch,
            recursive: "true", // This gets all nested files in one go!
        });

        // 3. Filter out things we don't want the AI to waste tokens on
        const ignoredPatterns = [
            "node_modules", ".git", "package-lock.json",
            ".png", ".jpg", ".svg", "dist", "build"
        ];

        return treeData.tree
            .filter((file) =>
                file.path && !ignoredPatterns.some(p => file.path?.includes(p))
            )
            .map((file) => ({
                path: file.path || "",
                type: file.type as "blob" | "tree",
                size: file.size
            }));

    } catch (error) {
        console.error("GitHub API Error:", error);
        throw new Error("Failed to fetch repository structure.");
    }
}

export async function getRepoLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
        const { data: languages } = await octokit.rest.repos.listLanguages({ owner, repo });
        return languages;
    } catch (error) {
        console.error("GitHub Language API Error:", error);
        return {};
    }
}