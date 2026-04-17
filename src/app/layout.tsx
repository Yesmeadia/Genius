import type { Metadata } from "next";
import { Figtree } from "next/font/google"; // New: Importing Figtree
import "./globals.css";
import Providers from "@/components/Providers";

const figtree = Figtree({ 
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"], // Supporting common weights
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "Genius Jam 3 | Event Registration",
  description: "Register for the ultimate talent hunt and showcase your skills.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${figtree.variable} font-figtree antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
