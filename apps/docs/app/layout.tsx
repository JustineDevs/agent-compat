import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://agents-compat.jstn.site"),
  title: {
    default: "Agent Compat",
    template: "%s | Agent Compat",
  },
  description:
    "Cross-agent environment compatibility SDK: detect, compile, validate.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <a
          href="#nd-page"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-fd-popover focus:px-3 focus:py-2 focus:text-fd-popover-foreground"
        >
          Skip to content
        </a>
        <RootProvider>{children}</RootProvider>
        <Analytics />
      </body>
    </html>
  );
}
