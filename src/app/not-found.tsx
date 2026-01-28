import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Rocket, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0B] text-white p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[30vw] h-[30vw] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[30vw] h-[30vw] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-2xl">
        {/* Animated Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
          <Rocket size={80} className="text-blue-400 relative z-10 animate-bounce" />
        </div>

        <div className="space-y-4">
          <h1 className="text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-blue-200">
            Repository Not Found
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            The codebase you are looking for has been moved, deleted, or never existed in this dimension.
            Check the URL or return to the landing bay.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 px-8 h-12 text-base">
              <Home size={18} />
              Return Home
            </Button>
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 h-12">
              <Search size={18} />
              Search on GitHub
            </Button>
          </a>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-8 text-xs text-slate-600">
        RepoNavigator AI &bull; System Status: Nominal
      </div>
    </div>
  )
}
