"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export function APIStatus({ onClick }: { onClick?: () => void }) {
    const [status, setStatus] = useState<'loading' | 'personal' | 'global' | 'missing'>('loading');

    useEffect(() => {
        const checkStatus = async () => {
            // 1. Check Local (Personal) Keys
            const hasGroq = localStorage.getItem("groq_api_key");
            const hasGemini = localStorage.getItem("google_api_key");

            if (hasGroq || hasGemini) {
                setStatus('personal');
                return;
            }

            // 2. Check Global (Server) Keys
            try {
                const res = await fetch('/api/keys-status');
                const data = await res.json();
                if (data.hasGroq || data.hasGemini) {
                    setStatus('global');
                } else {
                    setStatus('missing');
                }
            } catch (error) {
                console.error("Failed to check server keys", error);
                setStatus('missing');
            }
        };

        checkStatus();
        
        // Listen for storage events to update immediately if user saves new keys
        window.addEventListener('storage', checkStatus);
        // Custom event if we want to trigger it manually after save
        window.addEventListener('keys-updated', checkStatus); 

        return () => {
            window.removeEventListener('storage', checkStatus);
            window.removeEventListener('keys-updated', checkStatus);
        };
    }, []);

    if (status === 'loading') return null;

    const config = {
        personal: {
            icon: ShieldCheck,
            label: "Personal Mode",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        global: {
            icon: Shield,
            label: "Global Mode",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        missing: {
            icon: ShieldAlert,
            label: "Setup Required",
            color: "text-red-400",
            bg: "bg-red-500/10",
            border: "border-red-500/20"
        }
    }[status];

    const Icon = config.icon;

    return (
        <motion.button
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} hover:bg-opacity-20 transition-all`}
        >
            <Icon size={14} className={config.color} />
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </motion.button>
    );
}
