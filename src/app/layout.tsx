import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Discussly — Random Topic Generator & Discussion Timer",
  description:
    "Spin up engaging conversations with random discussion topics, a built-in timer, and your own custom topic library.",
  keywords: [
    "discussion topics",
    "random topic generator",
    "conversation starters",
    "discussion timer",
    "debate topics",
  ],
  authors: [{ name: "Discussly" }],
  openGraph: {
    title: "Discussly — Random Topic Generator & Discussion Timer",
    description:
      "Generate random discussion topics, run a timer, and build your own topic library.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <SonnerToaster position="bottom-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
