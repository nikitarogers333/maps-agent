import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indiana Jones — Maps Search Agent",
  description: "AI-powered local business search agent using Google Maps",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
