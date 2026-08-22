import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import "fumadocs-ui/css/neutral.css";
import "fumadocs-ui/css/preset.css";

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
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
