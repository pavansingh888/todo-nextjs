// /Users/pavan/Desktop/todo-nextjs/app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-8">
          <nav className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-gradient-to-r from-slate-800 to-slate-600 p-2">
                {/* Logo mark */}
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="4" fill="white" opacity="0.06" />
                  <path d="M6 12h12M6 16h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-tight">Nimbus Tasks</span>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:inline-block px-4 py-2 rounded-md text-sm font-medium border border-transparent bg-slate-900 text-white hover:opacity-95">
                Login
              </Link>
              <Link href="/dashboard" className="px-4 py-2 rounded-md text-sm font-medium border border-slate-200 hover:bg-slate-100">
                Dashboard
              </Link>
            </div>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-12 lg:py-20">
            {/* Left: Hero text */}
            <div className="lg:col-span-7">
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
                Beautifully simple task management, built for clarity.
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-2xl">
                Sign up quickly, create tasks, and stay focused. Automatic session timeout keeps your account secure — configurable from your profile.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-slate-900 text-white text-sm font-medium hover:opacity-95"
                >
                  Get Started
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-slate-200 text-sm font-medium hover:bg-slate-100"
                >
                  Explore Dashboard
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-slate-800/5 p-2">
                    <svg className="w-6 h-6 text-slate-900" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M3 7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Secure by default</div>
                    <div className="text-sm text-slate-500">HttpOnly cookies for session security</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-slate-800/5 p-2">
                    <svg className="w-6 h-6 text-slate-900" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Auto-logout</div>
                    <div className="text-sm text-slate-500">Idle detection with configurable timeout</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Mock dashboard card */}
            <div className="lg:col-span-5">
              <div className="mx-auto w-full max-w-md bg-white rounded-2xl shadow-lg ring-1 ring-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-500">Today</div>
                      <div className="text-lg font-semibold">3 tasks</div>
                    </div>
                    <div className="text-sm text-slate-400">Sep 14</div>
                  </div>
                </div>

                <div className="p-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="mt-1">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300" checked readOnly />
                      </div>
                      <div>
                        <div className="font-medium">Finalize project proposal</div>
                        <div className="text-sm text-slate-500">Due today • High priority</div>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="mt-1">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                      </div>
                      <div>
                        <div className="font-medium">Prepare UI mockups</div>
                        <div className="text-sm text-slate-500">Due tomorrow</div>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="mt-1">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                      </div>
                      <div>
                        <div className="font-medium">Sync with backend team</div>
                        <div className="text-sm text-slate-500">Meeting at 3PM</div>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="p-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">Add a task</div>
                    <button className="px-3 py-1 rounded bg-slate-900 text-white text-sm">+ New</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="font-medium text-lg">Lightweight</h3>
              <p className="mt-2 text-sm text-slate-500">Minimal, fast, and easy to use — built for productivity.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="font-medium text-lg">Reliable sync</h3>
              <p className="mt-2 text-sm text-slate-500">React Query powers caching, background refresh and resilient network calls.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="font-medium text-lg">Customizable</h3>
              <p className="mt-2 text-sm text-slate-500">Configure auto-logout, session settings and personalize your workspace.</p>
            </div>
          </div>

          <footer className="mt-16 py-10 border-t border-slate-100 text-sm text-slate-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>© {new Date().getFullYear()} Nimbus Tasks — Built with Next.js</div>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:underline">Privacy</a>
                <a href="#" className="hover:underline">Terms</a>
                <a href="#" className="hover:underline">Contact</a>
              </div>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
