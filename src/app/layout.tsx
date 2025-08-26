// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/context/SocketProvider";
import { SettingsProvider } from "@/context/SettingsProvider";
import { AudioProvider } from "@/context/AudioProvider";
import { AuthProvider } from "@/context/AuthProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Townhall Icebreaker",
  description: "The real-time trivia game for your whole team.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <AudioProvider>
              <SocketProvider>
                {children}
                <Toaster position="top-right" richColors />
              </SocketProvider>
            </AudioProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}