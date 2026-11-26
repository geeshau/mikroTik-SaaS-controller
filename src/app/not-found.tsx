import { FileQuestion, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-[#eef9f4] via-[#f0f7f4] to-[#e8f4f0]">
      <div className="glass-card rounded-2xl p-10 max-w-lg w-full text-center space-y-8">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center">
          <FileQuestion className="text-amber-500" size={40} />
        </div>
        <div>
          <h1 className="text-6xl font-extrabold text-slate-800 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-800 mt-3">Page not found</h2>
          <p className="text-slate-500 mt-3">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-teal-500/20"
          >
            <Home size={16} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
