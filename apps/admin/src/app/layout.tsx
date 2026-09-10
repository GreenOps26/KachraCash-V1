import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

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
    <html lang="en" className={`${outfit.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-[#F4F7F5] text-[#14241C] antialiased font-sans">
        {/* Top Navbar */}
        <header className="bg-white/80 backdrop-blur-md text-[#14241C] border-b border-[#E5EBE5] sticky top-0 z-50">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#143D2B] to-[#22C55E] flex items-center justify-center font-black text-white text-base shadow-sm">
                KC
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-[#0A2418] font-display">
                  KachraCash Admin
                </span>
                <span className="text-[11px] text-[#62776C] block -mt-0.5 font-medium">
                  কচৰা ক্যাশ • Guwahati Central Operations Console
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="px-3.5 py-1.5 rounded-full bg-[#F4F7F5] text-[#143D2B] border border-[#E5EBE5] font-medium">
                📍 Zone: Kamrup Metropolitan
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] flex items-center gap-1.5 font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                PostGIS Radar Active
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
