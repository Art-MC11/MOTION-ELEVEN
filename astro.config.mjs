import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://motion-eleven.fr",
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/admin/") && !page.includes("/merci/"),
      changefreq: "monthly",
    }),
  ],
});
