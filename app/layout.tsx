import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChessBet | P2P USDT Chess Betting Platform",
  description: "Play real-time P2P chess, stake USDT, and win instantly.",
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
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-black min-h-screen">
        {children}
      </body>
    </html>
  );
}