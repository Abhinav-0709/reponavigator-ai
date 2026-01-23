"use client";

import { deleteHistory } from "@/app/actions/deleteHistory";
import { useState } from "react";
import { Loader2, FolderGit2, Trash2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Repo {
    _id: string;
    name: string;
    owner: string;
    lastVisited: string;
    languages?: Record<string, number>;
}

export function RepoGrid({ repos }: { repos: Repo[] }) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (repoId: string) => {
        if (!confirm("Remove this repository from your history?")) return;
        setDeletingId(repoId);
        await deleteHistory(repoId);
        setDeletingId(null);
    };

    if (repos.length === 0) {
        // ... empty state ...
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo, i) => (
                <motion.div
                    // ... props ...
                    className="group relative bg-slate-900/50 border border-slate-800 rounded-xl hover:border-blue-500/50 transition-all overflow-hidden"
                >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                         <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete(repo._id);
                            }}
                            disabled={deletingId === repo._id}
                            className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                            {deletingId === repo._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </Button>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="p-5 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
                                    <FolderGit2 size={18} />
                                </div>
                                <div className="overflow-hidden"> {/* Fix truncation layout */}
                                    <h3 className="font-semibold text-slate-200 truncate max-w-[140px]" title={repo.name}>{repo.name}</h3>
                                    <p className="text-xs text-slate-500">{repo.owner}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tech Stack Badges */}
                        <div className="flex gap-2 mb-4 overflow-hidden h-6">
                             {repo.languages && Object.keys(repo.languages).slice(0, 3).map(lang => (
                                <span key={lang} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                    {lang}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
                            <div className="text-xs text-slate-500">
                                Visited {new Date(repo.lastVisited).toLocaleDateString()}
                            </div>
                            <Link href={`/chat/${repo._id}`}>
                                <Button size="sm" variant="ghost" className="h-8 gap-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                                    Open Chat <ArrowRight size={14} />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
