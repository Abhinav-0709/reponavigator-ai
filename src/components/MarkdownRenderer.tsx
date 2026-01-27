import React from 'react';
import ReactMarkdown from 'react-markdown';
import { MermaidBlock } from './MermaidBlock';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
    <div className="prose prose-invert prose-sm max-w-none text-slate-300">
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-blue-400 mb-4 mt-6" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-emerald-400 mb-3 mt-5" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-lg font-medium text-purple-400 mb-2 mt-4" {...props} />,
                table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-6 rounded-lg border border-slate-700">
                        <table className="w-full text-left text-sm text-slate-300" {...props} />
                    </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-slate-800 text-slate-100 uppercase font-semibold" {...props} />,
                tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-700 bg-slate-900/50" {...props} />,
                tr: ({ node, ...props }) => <tr className="hover:bg-slate-800/50 transition-colors" {...props} />,
                th: ({ node, ...props }) => <th className="px-4 py-3 border-b border-slate-700" {...props} />,
                td: ({ node, ...props }) => <td className="px-4 py-3" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 mb-4 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 mb-4 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="text-slate-300" {...props} />,
                code: ({ node, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '')
                    const language = match ? match[1] : '';

                    if (language === 'mermaid') {
                        return <MermaidBlock code={String(children).replace(/\n$/, '')} />;
                    }

                    return match ? (
                        <div className="rounded-md overflow-hidden my-4 border border-slate-700 bg-slate-900">
                            <div className="px-4 py-2 bg-slate-800 text-xs text-slate-400 border-b border-slate-700">
                                {match[1]}
                            </div>
                            <pre className="p-4 overflow-x-auto">
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            </pre>
                        </div>
                    ) : (
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm text-emerald-300 font-mono" {...props}>
                            {children}
                        </code>
                    )
                },
                blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 italic text-slate-400 bg-slate-900/50 rounded-r" {...props} />
                ),
                a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-4" {...props} />,
                p: ({ node, ...props }) => <p className="leading-7 mb-4 last:mb-0" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    </div>
);
}
