"use client";

import { motion } from "framer-motion";
import { Database, Zap, ShieldCheck, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsProps {
    activeRepos: number;
    tokenSavings: number;
}

export function StatsCards({ activeRepos, tokenSavings }: StatsProps) {
    const [apiKeyStatus, setApiKeyStatus] = useState<"active" | "missing">("missing");

    useEffect(() => {
        const hasGroq = localStorage.getItem("groq_api_key");
        const hasGemini = localStorage.getItem("google_api_key");
        if (hasGroq || hasGemini) setApiKeyStatus("active");
    }, []);

    const cards = [
        {
            label: "Active Repositories",
            value: activeRepos,
            icon: Database,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            label: "Est. Token Savings",
            value: `${(tokenSavings / 1000).toFixed(1)}k`,
            icon: Zap,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20"
        },
        {
            label: "API Connection",
            value: apiKeyStatus === "active" ? "Personal Key" : "No Key Set",
            icon: apiKeyStatus === "active" ? ShieldCheck : ShieldAlert,
            color: apiKeyStatus === "active" ? "text-emerald-400" : "text-red-400",
            bg: apiKeyStatus === "active" ? "bg-emerald-500/10" : "bg-red-500/10",
            border: apiKeyStatus === "active" ? "border-emerald-500/20" : "border-red-500/20"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {cards.map((card, i) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-6 rounded-2xl border ${card.border} ${card.bg} backdrop-blur-sm`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 rounded-lg bg-black/20 ${card.color}`}>
                            <card.icon size={20} />
                        </div>
                        {card.label === "API Connection" && (
                            <div className={`w-2 h-2 rounded-full ${apiKeyStatus === "active" ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
                        )}
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
                    <div className="text-sm text-slate-400">{card.label}</div>
                </motion.div>
            ))}
        </div>
    );
}
