import "./globals.css";

export const metadata = {
  title: "News Portal",
  description: "Stay updated with the latest news",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased max-w-3xl mx-auto p-4">{children}</body>
    </html>
  );
}
