"use client";

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose', 
});

interface MermaidBlockProps {
  code: string;
}

export function MermaidBlock({ code }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const renderDiagram = async () => {
      if (!code) return;

      // Unescape HTML entities (common issue when rendering via markdown)
      const cleanCode = code
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');

      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        // mermaid.render returns an object { svg: string } in valid promise based version, 
        // or just a string in older versions. 
        // Recent mermaid versions return a Promise resolving to { svg }.
        const { svg } = await mermaid.render(id, code);
        
        if (isMounted) {
          setSvg(svg);
          setError(null);
        }
      } catch (err: any) {
        console.error("Mermaid Render Error:", err);
        if (isMounted) {
            // Keep the previous SVG if ephemeral error, or show error?
            // Usually best to show error container
            setError("Unable to render diagram. Syntax error?");
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code]);

  if (error) {
     return (
        <div className="p-4 border border-red-500/20 bg-red-500/10 rounded text-red-400 text-xs font-mono whitespace-pre-wrap">
            {error}
            <div className="mt-2 text-slate-500 border-t border-red-500/10 pt-2">
                {code}
            </div>
        </div>
     );
  }

  return (
    <div 
      ref={elementRef}
      className="my-6 p-4 bg-slate-900/50 border border-slate-800 rounded-lg overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
}
