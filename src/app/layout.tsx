import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles.css";

export const metadata: Metadata = {
  title: "Chess Puzzle Reels",
  description: "Solve chess tactics in a vertical reels-style puzzle feed.",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml"
      }
    ],
    apple: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
