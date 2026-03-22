import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Dungeon Master",
  description: "An immersive AI-powered dark fantasy adventure — powered by Gemini",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}