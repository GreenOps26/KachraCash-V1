import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Sans } from 'next/font/google';
import { OperationsHeader } from '@/components/OperationsHeader';
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
  title: 'KachraCash Central Operations Console | Guwahati',
  description:
    'Dark operations command center for PostGIS logistics dispatch radar, dynamic floor rate cards, monsoon emergency governance, and SWM Rules 2026 compliance engine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${ibmPlexSans.variable}`}>
      <body className="min-h-screen bg-[#07110E] text-[#F1F5EF] antialiased font-sans selection:bg-[#C7FF3D] selection:text-[#07110E]">
        <OperationsHeader />
        <main className="max-w-[1720px] mx-auto px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
