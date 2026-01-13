"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { MarkdownRenderer } from "./MarkdownRenderer";

export function ChatInterface({ repoId }: { repoId: string }) {
    const [chatInput, setChatInput] = useState("");
    const { messages, sendMessage, status } = useChat();

    const isChatting = status === "submitted" || status === "streaming";

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        await sendMessage(
            { text: chatInput },
            { body: { repoId } }
        );

        setChatInput("");
    };

    return (
        <div className="flex flex-col h-[500px] md:h-[600px] w-full bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl flex gap-3 ${m.role === 'user' ? 'bg-blue-600' : 'bg-slate-800'
                            }`}>
                            <div className="text-sm">
                                <MarkdownRenderer content={(m as any).content || (m.parts && m.parts.filter(p => p.type === 'text').map(p => p.text).join('')) || ''} />
                            </div>
                        </div>
                    </div>
                ))}
                {isChatting && <Loader2 className="animate-spin text-blue-400 mx-auto" />}
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 border-t border-slate-800 flex gap-2 bg-slate-900/50">
                <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about the codebase..."
                    className="bg-slate-950 border-slate-700 text-white"
                />
                <Button type="submit" disabled={isChatting} className="bg-blue-600">
                    <Send size={18} />
                </Button>
            </form>
        </div>
    );
}