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
  title: {
    default: "Steam Wrapped | Your Gaming Story",
    template: "%s | Steam Wrapped",
  },
  description:
    "Discover your Steam gaming habits, favourites, and statistics with Steam Wrapped.",
  applicationName: "Steam Wrapped",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Steam Wrapped | Your Gaming Story",
    description:
      "Discover your Steam gaming habits, favourites, and statistics with Steam Wrapped.",
    type: "website",
    siteName: "Steam Wrapped",
  },
  twitter: {
    card: "summary",
    title: "Steam Wrapped | Your Gaming Story",
    description:
      "Discover your Steam gaming habits, favourites, and statistics with Steam Wrapped.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
