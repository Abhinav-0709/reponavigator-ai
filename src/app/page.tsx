"use client";

import { useState, useActionState } from "react";
import { ingestRepo } from "@/app/actions/ingestRepo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Github, Loader2, Search, Zap, Menu, Command } from "lucide-react";
import { TypewriterEffect } from "@/components/TypewriterEffect";
import { FloatingChat } from "@/components/FloatingChat";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { DownloadSummaryButton } from "@/components/DownloadSummaryButton";
import { motion } from "framer-motion";

export default function Home() {
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [viewState, setViewState] = useState<any>(null); // State for selected history item

    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const res = await ingestRepo(formData.get("repoUrl") as string);
        if (res.success) {
            setViewState(res.data); // Sync form result to view state
        }
        return res;
    }, null);

    return (
        <main className="min-h-screen bg-[#0A0A0B] text-white selection:bg-blue-500/30 overflow-x-hidden">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <HistoryDrawer
                isOpen={isDrawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSelectRepo={(repo) => {
                    setViewState(repo);
                    setDrawerOpen(false);
                }}
            />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between p-6 md:px-12 border-b border-white/5 backdrop-blur-md sticky top-0 bg-[#0A0A0B]/80">
                <div className="flex items-center gap-4">
                    <Button size="icon" variant="ghost" onClick={() => setDrawerOpen(true)} className="text-slate-400 hover:text-white">
                        <Menu />
                    </Button>
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                            <Command size={16} className="text-white" />
                        </div>
                        RepoNavigator
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <a href="https://github.com" target="_blank" className="text-slate-400 hover:text-white transition-colors">
                        <Github size={20} />
                    </a>
                </div>
            </header>

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6 mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 mb-4">
                        <Zap size={14} className="text-yellow-400" />
                        <span>Powered by Gemini & Groq Agents</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                        Map Github Repos <br />
                        <span className="text-blue-500">Instantly.</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Understand any codebase in seconds using our hybrid AI architecture. Authentication, Architecture, and Flow - mapped.
                    </p>
                </motion.div>

                {/* Input */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-full max-w-2xl relative group"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                    <form action={formAction} className="relative flex gap-2 bg-[#121214] p-2 pr-2 rounded-xl border border-white/10 shadow-2xl items-center">
                        <div className="pl-4 text-slate-500">
                            <Github size={20} />
                        </div>
                        <Input
                            name="repoUrl"
                            placeholder="github.com/owner/repo"
                            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-lg h-14 text-white placeholder:text-slate-600"
                            required
                        />
                        <Button
                            disabled={isPending}
                            className="h-12 px-8 bg-white text-black hover:bg-slate-200 rounded-lg font-semibold transition-all"
                        >
                            {isPending ? <Loader2 className="animate-spin" /> : "Analyze"}
                        </Button>
                    </form>
                </motion.div>

                {/* Results */}
                {(viewState || isPending) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full mt-24"
                    >
                        <div className="p-8 md:p-12 rounded-3xl bg-[#121214] border border-white/5 shadow-2xl relative overflow-hidden">
                            {/* Decorative top border */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                            {isPending ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin relative z-10" />
                                    </div>
                                    <p className="text-slate-400 text-lg animate-pulse">Consulting the Librarian...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{viewState.name}</h2>
                                            <p className="text-slate-400">{viewState.owner}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm border border-green-500/20">
                                                {viewState.status || 'Active'}
                                            </div>
                                            <DownloadSummaryButton targetId="repo-summary-content" filename={`${viewState.name}-summary.pdf`} />
                                        </div>
                                    </div>

                                    <div id="repo-summary-content" className="prose prose-invert max-w-none p-4 rounded-xl bg-[#121214]">
                                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Architecture Summary</h3>
                                        <div className="text-slate-300 leading-relaxed">
                                            <TypewriterEffect content={viewState.architectureMap} speed={3} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {viewState && <FloatingChat repoId={viewState._id} />}
                    </motion.div>
                )}
            </div>
        </main>
    );
}