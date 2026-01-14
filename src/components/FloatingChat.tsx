"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, MessageCircle, X, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { AnimatePresence, motion } from "framer-motion";

export function FloatingChat({ repoId }: { repoId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Pass repoId via custom header or body in requestOptions
    const { messages, setMessages, sendMessage, status } = useChat() as any;

    const [input, setInput] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const apiKeys = {
            groq: localStorage.getItem("groq_api_key") || undefined,
            google: localStorage.getItem("google_api_key") || undefined,
        };

        await sendMessage({
            text: input,
        }, { body: { repoId, apiKeys } });

        setInput("");
    };

    const isChatting = status === "submitted" || status === "streaming";
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load History
    useEffect(() => {
        if (!isOpen) return;

        async function loadHistory() {
            try {
                const res = await fetch(`/api/chat?repoId=${repoId}`);
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setMessages(data.map((msg: any) => ({
                        id: msg._id,
                        role: msg.role,
                        content: msg.content,
                        parts: [{ type: 'text', text: msg.content }] as any // Polyfill parts for strict types
                    })));
                }
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }
        loadHistory();
    }, [isOpen, repoId, setMessages]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <>
            {/* Trigger Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white z-50 hover:bg-blue-500 transition-colors"
                >
                    <MessageCircle size={28} />
                </motion.button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 100 }}
                        className={`fixed bottom-6 right-6 bg-slate-900 border border-slate-700/50 shadow-2xl rounded-2xl z-50 flex flex-col overflow-hidden backdrop-blur-xl
                            ${isExpanded 
                                ? 'w-[calc(100vw-3rem)] h-[calc(100vh-3rem)] md:w-[800px] md:h-[800px]' 
                                : 'w-[calc(100vw-3rem)] h-[500px] md:w-[450px] md:h-[600px]'}
                            transition-all duration-300 ease-in-out
                            max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)]
                        `}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-semibold text-slate-200">Architect Assistant</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 text-slate-400 hover:text-white">
                                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                                    <X size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                                    <MessageCircle size={48} className="opacity-20" />
                                    <p className="text-sm">Ask anything about the codebase...</p>
                                </div>
                            )}

                            {messages.map((m: any) => (
                                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'bg-slate-800/80 border border-slate-700/50 text-slate-200'
                                        }`}>
                                        {/* Handle content vs parts */}
                                        <MarkdownRenderer content={(m as any).content || (m.parts && m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')) || ''} />
                                    </div>
                                </div>
                            ))}
                            {isChatting && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800/50 p-3 rounded-2xl rounded-tl-none flex gap-2 items-center">
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                                        <span className="text-xs text-slate-400">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 bg-slate-900/50 border-t border-slate-800 flex gap-2">
                            <Input
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Type your question..."
                                className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50"
                            />
                            <Button type="submit" disabled={isChatting} size="icon" className="bg-blue-600 hover:bg-blue-500 w-10 h-10 shrink-0">
                                <Send size={18} />
                            </Button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
