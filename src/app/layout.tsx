import type { Metadata } from "next";
import { Montserrat, Geist, Geist_Mono } from 'next/font/google';
import "./globals.css";
import SessionProvider from '@/components/session-provider';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300','400','500','600','700'],
});

const geist = Geist_Mono({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Buyer Leads App",
  description: "Manage your buyer leads effectively",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} antialiased bg-gray-50 text-slate-900`}
      >
        <SessionProvider>
          <div className="min-h-screen flex flex-col">
            <header className="bg-white/60 backdrop-blur border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-semibold tracking-tight">Buyer Leads</div>
                    <div className="text-sm text-gray-500">Manage leads effortlessly</div>
                  </div>
                  <nav className="flex items-center space-x-2 text-sm text-gray-600">
                    <a href="/buyers" className="hover:text-gray-900">Buyers</a>
                    <a href="/buyers/new" className="hover:text-gray-900">New</a>
                    <a href="/buyers/import" className="hover:text-gray-900">Import</a>
                  </nav>
                </div>
              </div>
            </header>

            <main className="flex-1 w-full">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-transparent">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
