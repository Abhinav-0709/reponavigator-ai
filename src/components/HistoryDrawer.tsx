"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight, Github } from "lucide-react";
import { Button } from "./ui/button";

interface HistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRepo: (repo: any) => void;
}

export function HistoryDrawer({ isOpen, onClose, onSelectRepo }: HistoryDrawerProps) {
    const [repos, setRepos] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetch('/api/repos')
                .then(res => res.json())
                .then(data => setRepos(data))
                .catch(err => console.error(err));
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="fixed left-0 top-0 bottom-0 w-[80vw] md:w-[400px] bg-slate-900 border-r border-slate-800 z-50 flex flex-col shadow-2xl"
                    >
                        <div className="p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                                <Clock className="text-blue-400" />
                                Scan History
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {repos.map(repo => (
                                <button
                                    key={repo._id}
                                    onClick={() => {
                                        onSelectRepo(repo);
                                        onClose();
                                    }}
                                    className="w-full text-left p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Github className="text-slate-500 group-hover:text-white transition-colors" size={20} />
                                            <div>
                                                <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                                                    {repo.owner}/{repo.name}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {new Date(repo.updatedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-600 group-hover:translate-x-1 transition-transform" size={16} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
