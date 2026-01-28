"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "Inter, sans-serif"
});

interface MermaidRendererProps {
    chart: string;
}

export function MermaidRenderer({ chart }: MermaidRendererProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!chart) return;

        const renderChart = async () => {
            try {
                // Unique ID for each render to prevent collisions
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
                setError(null);
            } catch (err) {
                console.error("Mermaid Render Error:", err);
                // Mermaid creates an error element in the DOM by default, we just want to catch it 
                // and maybe show a fallback text.
                setError("Failed to render diagram.");
            }
        };

        renderChart();
    }, [chart]);

    if (error) {
        return (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
                {error}
                <pre className="mt-2 text-xs opacity-50 whitespace-pre-wrap">{chart}</pre>
            </div>
        );
    }

    return (
        <div 
            ref={ref}
            className="mermaid-container w-full overflow-x-auto p-4 bg-slate-900/50 rounded-xl border border-white/5 my-6 flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }} 
        />
    );
}
