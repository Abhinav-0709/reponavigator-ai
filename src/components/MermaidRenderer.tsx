"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import mermaid from "mermaid";

// 1. Initialize once, but strictly on the client
if (typeof window !== "undefined") {
    mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        fontFamily: "Inter, sans-serif",
        // This stops Mermaid from appending a "Syntax Error" div to your <body>
        suppressErrorRendering: true,
    });
}

interface MermaidRendererProps {
    chart: string;
}

export function MermaidRenderer({ chart }: MermaidRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // 2. useId() is the React 18 way to avoid "Hydration Mismatch"
    const reactId = useId().replace(/:/g, "");

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted || !chart) return;

        const renderChart = async () => {
            try {
                // 3. Unique ID that is consistent across re-renders
                const renderId = `mermaid-svg-${reactId}`;

                // 4. Sanitization
                let cleanChart = chart
                    .replace(/```mermaid\n?/g, '')
                    .replace(/```/g, '')
                    .trim();

                // Advanced Fix: Mermaid nodes cannot contain slashes or special chars unless quoted
                cleanChart = cleanChart.replace(/([a-zA-Z0-9]) \/ ([a-zA-Z0-9])/g, "$1_$2");

                // 5. The Render Call
                const { svg: renderedSvg } = await mermaid.render(renderId, cleanChart);
                setSvg(renderedSvg);
                setError(null);
            } catch (err) {
                console.error("Mermaid Render Error:", err);
                setError("Diagram Syntax Error");
            }
        };

        renderChart();
    }, [chart, isMounted, reactId]);

    // 6. Loading State (Prevents Hydration Errors)
    if (!isMounted) return <div className="h-32 w-full animate-pulse bg-slate-800/50 rounded-xl" />;

    if (error) {
        return (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚠️</span>
                    <strong>{error}</strong>
                </div>
                <pre className="mt-2 text-xs opacity-50 whitespace-pre-wrap bg-black/20 p-2 rounded">
                    {chart}
                </pre>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="mermaid-container w-full overflow-x-auto p-4 bg-slate-900/50 rounded-xl border border-white/5 my-6 flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}