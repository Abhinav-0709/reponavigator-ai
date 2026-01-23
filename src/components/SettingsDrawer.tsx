"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Save, Key, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
    const [groqKey, setGroqKey] = useState("");
    const [geminiKey, setGeminiKey] = useState("");
    const [isSaved, setIsSaved] = useState(false);
    const [serverKeys, setServerKeys] = useState({ hasGroq: false, hasGemini: false });

    useEffect(() => {
        // Fetch server key status
        fetch('/api/keys-status')
            .then(res => res.json())
            .then(data => setServerKeys(data))
            .catch(err => console.error("Failed to check server keys:", err));

        if (isOpen) {
            const savedGroq = localStorage.getItem("groq_api_key");
            const savedGemini = localStorage.getItem("google_api_key");
            if (savedGroq) setGroqKey(savedGroq);
            if (savedGemini) setGeminiKey(savedGemini);
        }
    }, [isOpen]);

    const StatusBadge = ({ hasLocal, hasServer }: { hasLocal: boolean, hasServer: boolean }) => {
        if (hasLocal) {
            return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Using Personal Key</span>;
        }
        if (hasServer) {
            return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Using Global Key</span>;
        }
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">No Key Configured</span>;
    };

    const handleSave = () => {
        localStorage.setItem("groq_api_key", groqKey);
        localStorage.setItem("google_api_key", geminiKey);
        setIsSaved(true);
        // Dispatch event to update other components (like APIStatus in header)
        window.dispatchEvent(new Event('keys-updated'));
        setTimeout(() => setIsSaved(false), 2000);
        onClose();
    };

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
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-[80vw] md:w-[400px] bg-slate-950 border-l border-slate-800 z-[70] flex flex-col shadow-2xl"
                    >
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                                <Settings className="text-emerald-400" />
                                Settings
                            </h2>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-emerald-400">
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300 flex items-center gap-2">
                                        <Key size={14} className="text-purple-400" />
                                        Groq API Key (Llama 3)
                                    </Label>
                                    <Input
                                        type="password"
                                        value={groqKey}
                                        onChange={(e) => setGroqKey(e.target.value)}
                                        placeholder="gsk_..."
                                        className="bg-slate-900 border-slate-700 text-white font-mono text-sm"
                                    />
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                        <p className="text-slate-500">
                                            Used for planning and research (Librarian Agent).
                                        </p>
                                        <div className="shrink-0">
                                            <StatusBadge hasLocal={!!groqKey} hasServer={serverKeys.hasGroq} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300 flex items-center gap-2">
                                        <Key size={14} className="text-blue-400" />
                                        Gemini API Key
                                    </Label>
                                    <Input
                                        type="password"
                                        value={geminiKey}
                                        onChange={(e) => setGeminiKey(e.target.value)}
                                        placeholder="AIza..."
                                        className="bg-slate-900 border-slate-700 text-white font-mono text-sm"
                                    />
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                        <p className="text-slate-500">
                                            Used for generating final responses (Architect Agent).
                                        </p>
                                        <div className="shrink-0">
                                            <StatusBadge hasLocal={!!geminiKey} hasServer={serverKeys.hasGemini} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                                <p className="text-xs text-blue-300 leading-relaxed">
                                    <strong>Note:</strong> Your keys are stored locally in your browser and are sent directly to the server for your session only. They are never saved to our database.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                            <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                                <Save size={16} />
                                {isSaved ? "Saved!" : "Save Configuration"}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
