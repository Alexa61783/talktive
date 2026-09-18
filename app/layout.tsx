import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Talktive",
  description: "Talktive — your friendly AI companion.",
  manifest: "/manifest.json",
  themeColor: "#000000",
  icons: {
    icon: "/ChatGPT%20Image%20Sep%2013,%202026,%2009_07_41%20AM.png",
    apple: "/ChatGPT%20Image%20Sep%2013,%202026,%2009_07_41%20AM.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}