import type { MetadataRoute } from "next";
import { source } from "@/lib/source";

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({
    url: `https://agents-compat.jstn.site${page.url}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: page.url === "/docs" ? 1 : 0.7,
  }));
}
