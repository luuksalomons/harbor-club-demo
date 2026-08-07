import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { RegisterServiceWorker } from "./register-sw";
import "./globals.css";

// Royal Mission huisstijl: Inter voor leestekst, Bricolage Grotesque voor
// koppen/kijktekst (zie royal mission/huisstijl/.../Huisstijl Handboek).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171112" },
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
      className={`${inter.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
