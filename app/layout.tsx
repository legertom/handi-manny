import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatWidget } from "@/components/chat-widget";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800", "900"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f8fc",
};

export const metadata: Metadata = {
  title: {
    default: "Handi-Manny — NYC's most trusted handyman",
    template: "%s · Handi-Manny",
  },
  description:
    "TV mounts, AC installs, IKEA assembly, faucets, wall repair, and the rest of your NYC apartment punch list. 10 years, 5 stars on TaskRabbit.",
  metadataBase: new URL("https://handimanny.com"),
  openGraph: {
    title: "Handi-Manny — NYC's most trusted handyman",
    description:
      "Book a vetted NYC handyman online in under 2 minutes. Flat-rate jobs, transparent pricing, real humans.",
    type: "website",
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
      className={`${jakarta.variable} ${archivo.variable} ${jetbrains.variable} h-full`}
    >
      <body className="min-h-full flex flex-col relative">
        <SiteHeader />
        <main className="flex-1 relative z-10">{children}</main>
        <SiteFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
