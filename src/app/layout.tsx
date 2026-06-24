import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AgentBanner } from "@/components/AgentBanner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OrchardPatch",
  description: "Complete macOS fleet app visibility and smart patching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={inter.className}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.setAttribute('data-theme', window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light');" }} />
      </head>
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <AgentBanner />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
