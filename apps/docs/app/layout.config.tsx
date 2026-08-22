import type { DocsLayoutProps } from "fumadocs-ui/layouts/docs";

export const baseOptions: Omit<DocsLayoutProps, "tree"> = {
  nav: {
    title: "Agent Compat",
    url: "https://agents-compat.jstn.site",
  },
  links: [
    { text: "npm", url: "https://www.npmjs.com/package/@jstn-sdk/agents" },
    { text: "GitHub", url: "https://github.com/JustineDevs/agent-compat" },
  ],
};
