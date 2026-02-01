import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { JobNestProvider } from "@/lib/context";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JobNest | Premium Job & Gig Marketplace",
  description: "Production-ready mobile application for professional gigs and job discovery.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="ios-scrollbar" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden bg-[#FBFAFF] min-h-screen`}>
        <JobNestProvider>
          <div className="flex min-h-screen">
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-72 relative min-h-screen">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 lg:pb-8">
                {children}
              </div>
            </main>
          </div>

          <div className="lg:hidden">
            <BottomNav />
          </div>

          <Toaster
            position="top-center"
            toastOptions={{
              className: 'glass-card text-slate-800 dark:text-white rounded-2xl border border-white/20',
              duration: 3000,
            }}
          />
        </JobNestProvider>
      </body>
    </html>
  );
}

