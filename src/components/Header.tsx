"use client";

import { useState } from "react";
import { Link as LinkIcon, Github, Menu, X, Settings, Command, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/SignInButton";
import { APIStatus } from "@/components/APIStatus";
import Link from "next/link";

interface HeaderProps {
    onOpenHistory?: () => void;
    onOpenSettings?: () => void;
}

export function Header({ onOpenHistory, onOpenSettings }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-[#0A0A0B]/80 sticky top-0">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-3">
                    {onOpenHistory && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onOpenHistory}
                            className="text-slate-400 hover:text-blue-400 md:hidden"
                        >
                            <Menu size={20} />
                        </Button>
                    )}

                    <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
                        <div className="p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                            <Command size={18} className="text-white" />
                        </div>
                        <span className="hidden md:block">RepoNavigator</span>
                    </Link>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-3">
                    <Link href="/compare">
                        <Button variant="ghost" className="text-slate-400 hover:text-orange-400 gap-2">
                            <Swords size={18} />
                            <span className="hidden lg:inline">Battle</span>
                        </Button>
                    </Link>
                    <SignInButton />
                    <div className="h-6 w-px bg-white/10" />
                    {onOpenSettings && <APIStatus onClick={onOpenSettings} />}
                    {onOpenSettings && (
                        <Button size="icon" variant="ghost" onClick={onOpenSettings} className="text-slate-400 hover:text-blue-400">
                            <Settings size={20} />
                        </Button>
                    )}
                    <a href="https://github.com" target="_blank" className="text-slate-400 hover:text-white transition-colors">
                        <Github size={20} />
                    </a>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-slate-300 p-2"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X /> : <Settings size={22} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-[#0A0A0B] border-b border-white/5 p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Authentication</span>
                        <SignInButton />
                    </div>
                    <div className="h-px bg-white/5" />

                    {onOpenSettings && (
                        <>
                            <div className="flex justify-between items-center" onClick={onOpenSettings}>
                                <span className="text-sm text-slate-500">API Keys</span>
                                <APIStatus />
                            </div>

                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2 border-slate-800 text-slate-500"
                                onClick={onOpenSettings}
                            >
                                <Settings size={16} /> Configure Settings
                            </Button>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
