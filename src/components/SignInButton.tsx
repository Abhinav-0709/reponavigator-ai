"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Github, Loader2 } from "lucide-react";
import { useState } from "react";

export function SignInButton() {
    const [isLoading, setIsLoading] = useState(false);
    const session = authClient.useSession();

    const handleSignIn = async () => {
        setIsLoading(true);
        await authClient.signIn.social({
            provider: "github",
            callbackURL: "/",
        });
    };

    const handleSignOut = async () => {
        setIsLoading(true);
        await authClient.signOut();
        window.location.reload();
    };

    if (session.data) {
        return (
            <div className="flex items-center gap-3">
                {session.data.user.image && (
                    <img
                        src={session.data.user.image}
                        alt={session.data.user.name}
                        className="w-8 h-8 rounded-full border border-slate-700"
                    />
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={isLoading}
                    className="text-slate-400 hover:text-red-400"
                >
                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Sign Out"}
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSignIn}
            disabled={isLoading}
            className="gap-2 bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200"
        >
            {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Github size={16} />}
            Sign In
        </Button>
    );
}
