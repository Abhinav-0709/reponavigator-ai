import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export interface FileNode {
    path: string;
    type: "blob" | "tree";
    size?: number;
}


export async function getRepoStructure(owner: string, repo: string): Promise<{ files: FileNode[], hash: string }> {
    try {
        // 1. Get the default branch (usually 'main' or 'master')
        const { data: repository } = await octokit.rest.repos.get({ owner, repo });
        const defaultBranch = repository.default_branch;

        // 2. Get the latest commit SHA of the default branch
        const { data: branchData } = await octokit.rest.repos.getBranch({
            owner,
            repo,
            branch: defaultBranch,
        });
        const latestHash = branchData.commit.sha;

        // 3. Fetch the full recursive tree using the commit SHA
        const { data: treeData } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: latestHash,
            recursive: "true", // This gets all nested files in one go!
        });

        // 4. Filter out things we don't want the AI to waste tokens on
        const ignoredPatterns = [
            "node_modules", ".git", "package-lock.json",
            ".png", ".jpg", ".svg", "dist", "build"
        ];

        const files = treeData.tree
            .filter((file) =>
                file.path && !ignoredPatterns.some(p => file.path?.includes(p))
            )
            .map((file) => ({
                path: file.path || "",
                type: file.type as "blob" | "tree",
                size: file.size
            }));

        return { files, hash: latestHash };

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

export async function getRepoDiff(owner: string, repo: string, base: string, head: string): Promise<string[]> {
    try {
        const { data } = await octokit.rest.repos.compareCommits({
            owner,
            repo,
            base,
            head,
        });

        // Limit to 20 files to keep context small for "Patch Updates"
        // If more than 20 changed, the caller should probably do a full re-scan.
        return (data.files || [])
            .map(f => f.filename)
            .filter(f => f); // ensure no undefined
    } catch (error) {
        console.error("GitHub Diff API Error:", error);
        return [];
    }
}