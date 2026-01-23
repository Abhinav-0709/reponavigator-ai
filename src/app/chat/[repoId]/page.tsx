"use client";

import { useChat } from "@ai-sdk/react";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const repoId = params.repoId as string;

    // Pass repoId via custom header or body in requestOptions
    const { messages, setMessages, sendMessage, status } = useChat() as any;
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Load History
    useEffect(() => {
        async function loadHistory() {
            try {
                const res = await fetch(`/api/chat?repoId=${repoId}`);
                if (!res.ok) return; // Repo might not exist or chat empty

                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setMessages(data.map((msg: any) => ({
                        id: msg._id,
                        role: msg.role,
                        content: msg.content,
                        parts: [{ type: 'text', text: msg.content }] as any
                    })));
                }
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }
        if (repoId) loadHistory();
    }, [repoId, setMessages]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen bg-[#0A0A0B] text-slate-200">
            {/* Header */}
            <header className="flex items-center gap-4 p-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-bold text-lg text-white">Architect Assistant</h1>
                    <p className="text-xs text-slate-500">Repository Context Active</p>
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                        <div className="p-4 bg-slate-900 rounded-full border border-slate-800">
                            <Loader2 size={32} className="opacity-20" />
                        </div>
                        <p className="text-lg font-medium">Start a conversation about this codebase.</p>
                        <p className="text-sm max-w-md text-center">I have read the file structure and can help you navigate, explain patterns, or find specific logic.</p>
                    </div>
                )}

                {messages.map((m: any) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] md:max-w-[70%] p-4 rounded-3xl text-sm leading-relaxed ${m.role === 'user'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 rounded-tr-none'
                                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                            }`}>
                            <MarkdownRenderer content={(m as any).content || (m.parts && m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')) || ''} />
                        </div>
                    </div>
                ))}

                {isChatting && (
                    <div className="flex justify-start">
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl rounded-tl-none flex gap-3 items-center">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                            <span className="text-sm text-slate-400">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 border-t border-white/5 bg-black/40 backdrop-blur-lg">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask complicated questions..."
                        className="h-12 bg-slate-900/50 border-slate-800 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 text-base"
                    />
                    <Button
                        type="submit"
                        disabled={isChatting}
                        className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-900/20"
                    >
                        Send <Send size={16} className="ml-2" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
