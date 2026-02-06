"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Github, Loader2, Search, Zap, Menu, Command, Settings } from "lucide-react";
import { TypewriterEffect } from "@/components/TypewriterEffect";
import { FloatingChat } from "@/components/FloatingChat";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { DownloadSummaryButton } from "@/components/DownloadSummaryButton";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { Header } from "@/components/Header";


export default function Home() {
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [viewState, setViewState] = useState<any>(null); // State for selected history item
    const [activeTab, setActiveTab] = useState<"arch" | "devops">("arch");

    // Progress State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progressStatus, setProgressStatus] = useState<string>("");

    const handleAnalyze = async (formData: FormData) => {
        const repoUrl = formData.get("repoUrl") as string;
        if (!repoUrl) return;

        setIsAnalyzing(true);
        setProgressStatus("Initializing...");
        // setViewState(null); // Keep previous for exit animation

        try {
            const apiKeys = {
                groq: localStorage.getItem("groq_api_key") || undefined,
                google: localStorage.getItem("google_api_key") || undefined,
            };

            const response = await fetch('/api/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: repoUrl, apiKeys })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            const minDelay = new Promise(resolve => setTimeout(resolve, 1500));

            // Wait for both the first chunk AND the minimum delay
            // But since we are streaming, we just start the timer

            // Track if we finished too fast
            const startTime = Date.now();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    try {
                        const update = JSON.parse(line);

                        if (update.status) {
                            setProgressStatus(update.message);
                        }
                        if (update.success) {
                            // Enforce minimum animation time
                            const elapsed = Date.now() - startTime;
                            if (elapsed < 3000) {
                                await new Promise(resolve => setTimeout(resolve, 3000 - elapsed));
                            }

                            setViewState(update.data);
                            setIsAnalyzing(false);
                        }
                        if (update.success === false) {
                            console.error(update.error);
                            setProgressStatus(`Error: ${update.error}`);
                            setIsAnalyzing(false);
                        }
                    } catch (e) {
                        console.error("Error parsing chunk", e);
                    }
                }
            }
        } catch (e: any) {
            console.error("Stream Error", e);
            setProgressStatus("An unexpected error occurred.");
            setIsAnalyzing(false);
        }
    };

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
            <Header
                onOpenHistory={() => setDrawerOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
            />

            <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />

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
                    <form action={handleAnalyze} className="relative flex gap-2 bg-[#121214] p-2 pr-2 rounded-xl border border-white/10 shadow-2xl items-center">
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
                            disabled={isAnalyzing}
                            className="h-12 px-8 bg-white text-black hover:bg-slate-200 rounded-lg font-semibold transition-all"
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin" /> : "Analyze"}
                        </Button>
                    </form>
                </motion.div>

                {/* Results */}
                <div className="w-full mt-24">
                    {/* Only render if we have something to show */}
                    {(viewState || isAnalyzing) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-8 md:p-12 rounded-3xl bg-[#121214] border border-white/5 shadow-2xl relative overflow-hidden"
                        >
                            {/* Decorative top border */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                            <div className="min-h-[200px]">
                                <AnimatePresence mode="wait">
                                    {isAnalyzing ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center py-20 space-y-6"
                                        >
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin relative z-10" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <motion.p
                                                    key={progressStatus} // Animate text changes
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-slate-200 text-lg font-medium"
                                                >
                                                    {progressStatus}
                                                </motion.p>
                                                <p className="text-xs text-slate-500">This might take up to 60s for large repos</p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="results"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="space-y-6"
                                        >
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


                                            <div className="border-b border-white/5 pb-4 mb-4 flex gap-6">
                                                <button
                                                    onClick={() => setActiveTab("arch")}
                                                    className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'arch' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    Architecture
                                                    {activeTab === 'arch' && (
                                                        <motion.div layoutId="tab-underline" className="absolute left-0 right-0 bottom-[-1px] h-0.5 bg-blue-400" />
                                                    )}
                                                </button>

                                                {/* Only show DevOps tab if report exists or we want to show empty state */}
                                                {viewState.devopsReport && (
                                                    <button
                                                        onClick={() => setActiveTab("devops")}
                                                        className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'devops' ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
                                                    >
                                                        DevOps & Deployment
                                                        {activeTab === 'devops' && (
                                                            <motion.div layoutId="tab-underline" className="absolute left-0 right-0 bottom-[-1px] h-0.5 bg-purple-400" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            <div id="repo-summary-content" className="prose prose-invert max-w-none p-4 rounded-xl bg-[#121214] min-h-[300px]">
                                                {/* Architecture Tab */}
                                                <div className={activeTab === 'arch' ? 'block animate-in fade-in duration-500' : 'hidden'}>
                                                    <TypewriterEffect key={viewState._id + "-arch"} content={viewState.architectureMap} speed={3} />
                                                </div>

                                                {/* DevOps Tab */}
                                                {viewState.devopsReport && (
                                                    <div className={activeTab === 'devops' ? 'block animate-in fade-in duration-500' : 'hidden'}>
                                                        <TypewriterEffect key={viewState._id + "-devops"} content={viewState.devopsReport} speed={3} />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}

                    {viewState && !isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <FloatingChat repoId={viewState._id} />
                        </motion.div>
                    )}
                </div>
            </div>
        </main>
    );
}