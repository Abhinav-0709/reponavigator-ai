"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { compareRepos } from "@/app/actions/compareRepos";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Loader2, Swords } from "lucide-react";
import { motion } from "framer-motion";

interface RepoOption {
    _id: string;
    name: string;
    owner: string;
}

export default function ComparePage() {
    const [repos, setRepos] = useState<RepoOption[]>([]);
    const [selected1, setSelected1] = useState<string>("");
    const [selected2, setSelected2] = useState<string>("");
    const [comparisonResult, setComparisonResult] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/repos")
            .then(res => res.json())
            .then(data => setRepos(data))
            .catch(err => console.error("Failed to load repos:", err));
    }, []);

    const handleCompare = async () => {
        if (!selected1 || !selected2) return;
        setLoading(true);
        setComparisonResult("");

        const result = await compareRepos(selected1, selected2);

        if (result.success && result.comparison) {
            setComparisonResult(result.comparison);
        } else {
            setComparisonResult("Failed to generate comparison.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
            <Header />

            <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-3">
                        <Swords className="text-red-400" /> Repository Battle
                    </h1>
                    <p className="text-slate-400">Select two repositories to compare their architecture side-by-side.</p>
                </div>

                {/* Selection Area */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-8">
                    {/* Repo 1 */}
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Repository A</label>
                        <Select value={selected1} onValueChange={setSelected1}>
                            <SelectTrigger className="w-full bg-w-900 border-slate-700">
                                <SelectValue placeholder="Select Repo..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                {repos.map(r => (
                                    <SelectItem key={r._id} value={r._id} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer">
                                        {r.owner}/{r.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* VS Badge */}
                    <div className="flex justify-center">
                        <div className="bg-slate-800 p-3 rounded-full border border-slate-700 text-slate-400 font-bold">VS</div>
                    </div>

                    {/* Repo 2 */}
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Repository B</label>
                        <Select value={selected2} onValueChange={setSelected2}>
                            <SelectTrigger className="w-full bg-slate-900 border-slate-700">
                                <SelectValue placeholder="Select Repo..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                {repos.map(r => (
                                    <SelectItem key={r._id} value={r._id} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer">
                                        {r.owner}/{r.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-center mb-12">
                    <Button
                        size="lg"
                        onClick={handleCompare}
                        disabled={loading || !selected1 || !selected2 || selected1 === selected2}
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold px-8 shadow-lg shadow-red-900/20"
                    >
                        {loading ? <><Loader2 className="animate-spin mr-2" /> Analyzing...</> : <><Swords className="mr-2" /> Start Battle</>}
                    </Button>
                </div>

                {/* Results */}
                {comparisonResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 shadow-2xl"
                    >
                        <MarkdownRenderer content={comparisonResult} />
                    </motion.div>
                )}
            </main>
        </div>
    );
}
