import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ScrollToTop from "@/components/ScrollToTop";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "YES genius | National Level Talent Search",
  description: "National Level Talent Search by YES India Foundation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${figtree.variable} font-figtree antialiased`} suppressHydrationWarning>
        {/* Cache Bust */}
        <Providers>
          <ScrollToTop />
          {children}
        </Providers>
      </body>
    </html>
  );
}
