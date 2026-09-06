import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KachraCash Admin Operations Portal | Guwahati',
  description: 'Operations, logistics dispatch radar, and circular economy compliance engine for KachraCash',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-base">
                KC
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white">
                  KachraCash Admin
                </span>
                <span className="text-[11px] text-slate-400 block -mt-1 font-medium">
                  কচৰা ক্যাশ • Guwahati Central Operations Console
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                📍 Zone: Kamrup Metropolitan
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Neon PostGIS Connected
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
