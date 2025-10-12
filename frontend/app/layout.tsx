import "./globals.css";

export const metadata = {
  title: "Engineering CAD AI",
  description: "AI-powered engineering analysis and CAD generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}

