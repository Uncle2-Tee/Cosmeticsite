import "./globals.css";

export const metadata = {
  title: "Doresther Tradings — Skincare, considered",
  description: "A thoughtful collection of high-performance beauty essentials from Doresther Tradings.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
