"use server";

import dbConnect from "@/lib/dbConnect";
import UserHistory from "@/models/UserHistory";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteHistory(repoId: string) {
    try {
        await dbConnect();

        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) return { error: "Unauthorized" };

        const userId = session.user.id;

        await UserHistory.deleteOne({ userId, repository: repoId });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Delete History Error", error);
        return { error: "Failed to delete" };
    }
}
