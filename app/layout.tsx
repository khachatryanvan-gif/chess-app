import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Betting Platform",
  description: "Play Chess and Bet USDT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Chessground CSS & Themes */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/chessground@9.1.1/assets/chessground.base.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/chessground@9.1.1/assets/chessground.brown.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/chessground@9.1.1/assets/chessground.cbm.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}