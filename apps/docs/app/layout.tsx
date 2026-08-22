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
  applicationName: "Agent Compat",
  keywords: [
    "agent compatibility",
    "AI agent SDK",
    "AGENTS.md",
    "agent skills",
    "TypeScript",
  ],
  authors: [{ name: "Justine Devs", url: "https://github.com/JustineDevs" }],
  creator: "Justine Devs",
  publisher: "Justine Devs",
  alternates: { canonical: "/docs" },
  openGraph: {
    type: "website",
    siteName: "Agent Compat",
    title: "Agent Compat | Cross-agent compatibility SDK",
    description:
      "Detect, compile, and validate project integrations across AI coding environments.",
    url: "/docs",
    images: [
      {
        url: "/assets/banner.png",
        width: 2508,
        height: 627,
        alt: "Agent Compat cross-agent environment compatibility SDK",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Compat | Cross-agent compatibility SDK",
    description:
      "Detect, compile, and validate project integrations across AI coding environments.",
    images: ["/assets/banner.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "Justine Devs",
                  url: "https://github.com/JustineDevs",
                },
                {
                  "@type": "SoftwareApplication",
                  name: "@jstn-sdk/agents",
                  applicationCategory: "DeveloperApplication",
                  operatingSystem: "Cross-platform",
                  description: metadata.description,
                  url: "https://agents-compat.jstn.site/docs",
                  image: "https://agents-compat.jstn.site/assets/banner.png",
                  codeRepository: "https://github.com/JustineDevs/agent-compat",
                  programmingLanguage: "TypeScript",
                  author: { "@type": "Organization", name: "Justine Devs" },
                },
                {
                  "@type": "WebSite",
                  name: "Agent Compat",
                  url: "https://agents-compat.jstn.site",
                },
              ],
            }),
          }}
        />
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
