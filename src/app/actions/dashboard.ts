"use server";

import dbConnect from "@/lib/dbConnect";
import UserHistory from "@/models/UserHistory";
import ActivityLog from "@/models/ActivityLog";
import Repository from "@/models/Repository";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getDashboardData() {
    await dbConnect();

    // 🔧 FIX: Force registration of Repository model before population
    // This prevents "Schema hasn't been registered" error in serverless cold starts
    if (!Repository) { /* no-op, just side-effect of import */ }

    // 1. Get current user session
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // 2. Fetch User History (Populated with Repo details)
    const history = await UserHistory.find({ userId })
        .sort({ lastVisited: -1 })
        .populate("repository")
        .lean();

    // 3. Fetch Activity Log
    const activities = await ActivityLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(20)
        .lean();

    // 4. Calculate Stats
    const totalRepos = history.length;
    // @ts-ignore
    const tokenSavings = history.reduce((acc, curr) => acc + (curr.repository?.tokenUsage || 0), 0);

    return {
        stats: {
            activeRepos: totalRepos,
            tokenSavings: tokenSavings,
        },
        repos: history.map((h: any) => {
            const repo = h.repository;
            if (!repo) return null;
            return {
                _id: repo._id.toString(),
                name: repo.name,
                owner: repo.owner,
                languages: repo.languages || {}, // languages is a Map/Object, needs care if it's a Map
                lastVisited: h.lastVisited.toISOString(),
                // Add other fields if needed for the grid
            };
        }).filter((repo): repo is NonNullable<typeof repo> => repo !== null), // Type guard to remove nulls
        activities: activities.map(a => ({
            _id: a._id.toString(),
            action: a.action,
            details: a.details,
            timestamp: a.timestamp.toISOString()
        }))
    };
}
