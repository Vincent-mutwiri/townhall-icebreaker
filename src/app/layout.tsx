// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/context/SocketProvider"; // Import the provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Townhall Icebreaker",
  description: "The real-time trivia game for your whole team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SocketProvider>{children}</SocketProvider> {/* Wrap here */}
      </body>
    </html>
  );
}