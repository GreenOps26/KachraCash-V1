import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
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
    <html lang="en" className={`${fraunces.variable} ${ibmPlexSans.variable}`}>
      <body className="min-h-screen bg-[#07110E] text-[#F1F5EF] antialiased font-sans">
        <header className="bg-[#0C1915] text-[#F1F5EF] border-b border-[#10221C] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C97A2B] flex items-center justify-center font-black text-[#07110E] text-base font-display">
                KC
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-[#F1F5EF] font-display">
                  KachraCash Admin
                </span>
                <span className="text-[11px] text-[#DEEAE3]/70 block -mt-1 font-medium">
                  কচৰা ক্যাশ • Guwahati Central Operations Console
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-[#10221C] text-[#DEEAE3] border border-[#1F4D3C]/40">
                📍 Zone: Kamrup Metropolitan
              </span>
              <span className="px-3 py-1 rounded-full bg-[#1F4D3C]/30 text-[#55F3CF] border border-[#059669]/40 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#C7FF3D] animate-pulse"></span>
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
