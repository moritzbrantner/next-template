import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Next Template',
  description: 'A simple Next.js template with localized routing via next-intl.',
};

const themeScript = `
(() => {
  const storedTheme = window.localStorage.getItem("theme");
  const theme = storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
