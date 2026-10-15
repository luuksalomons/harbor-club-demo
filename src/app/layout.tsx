import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { RegisterServiceWorker } from "./register-sw";
import { RouteProvider } from "./route-provider";
import "./globals.css";

// Untitled UI typeface: Inter for body text and headings.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Harbor Club Portal (Demo)",
  description: "Live demo of a self-service member portal, built for Fiverr buyers to try",
  appleWebApp: {
    capable: true,
    title: "Harbor Club",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RouteProvider>{children}</RouteProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
