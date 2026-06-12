/**
 * layout.js — Next.js Root Layout
 * โหลด Google Fonts: Sarabun + Prompt
 */

import "./globals.css";

export const metadata = {
  title:       "The Pro Supervisor",
  description: "AI-powered Thai restaurant review analysis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Prompt:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}