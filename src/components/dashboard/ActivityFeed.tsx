"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, GitCommit, FileSearch } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Log {
    _id: string;
    action: string;
    details: string;
    timestamp: string;
}

export function ActivityFeed({ activities }: { activities: Log[] }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-full">
            <h3 className="flex items-center gap-2 font-semibold text-slate-200 mb-6">
                <Activity size={18} className="text-purple-400" />
                Activity Feed
            </h3>

            <ScrollArea className="h-[400px] -mr-4 pr-4">
                <div className="space-y-6">
                    {activities.map((log) => (
                        <div key={log._id} className="relative pl-6 border-l border-slate-800">
                            <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ring-4 ring-slate-900 ${
                                log.action === 'INGEST' ? 'bg-blue-500' : 'bg-emerald-500'
                            }`} />
                            <div className="mb-1 text-xs text-slate-500 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                            <p className="text-sm text-slate-300">
                                {log.details}
                            </p>
                        </div>
                    ))}
                    {activities.length === 0 && (
                        <div className="text-sm text-slate-500 italic">No recent activity.</div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
