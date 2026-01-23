import { getDashboardData } from "@/app/actions/dashboard";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RepoGrid } from "@/components/dashboard/RepoGrid";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const data = await getDashboardData();

    if ('error' in data) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-slate-200">
            {/* Simple Dashboard Header */}
            <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <h1 className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                     <a href="/" className="text-sm text-slate-500 hover:text-white transition-colors">
                        ← Back to Search
                    </a>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content (Left) */}
                    <div className="flex-1">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mb-2">
                                Welcome back
                            </h2>
                            <p className="text-slate-500">
                                Here is what your AI Architects have been up to.
                            </p>
                        </div>

                        <StatsCards 
                            activeRepos={data.stats.activeRepos} 
                            tokenSavings={data.stats.tokenSavings} 
                        />

                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Your Repositories</h3>
                        </div>
                        
                        <RepoGrid repos={data.repos} />
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="w-full lg:w-80 shrink-0">
                        <ActivityFeed activities={data.activities} />
                    </div>
                </div>
            </main>
        </div>
    );
}
