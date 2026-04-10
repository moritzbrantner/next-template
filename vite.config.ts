import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import {
  normalizePublicBasePath,
  normalizeRouterBasePath,
} from "./src/runtime/base-path";

const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = normalizePublicBasePath(
  process.env.GITHUB_PAGES_BASE_PATH ??
    (isGithubPagesBuild
      ? process.env.GITHUB_REPOSITORY?.split("/")[1]
      : undefined),
);
const githubPagesRouterBasePath = normalizeRouterBasePath(githubPagesBasePath);

export default defineConfig({
  base: isGithubPagesBuild ? githubPagesBasePath : "/",
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart(
      isGithubPagesBuild
        ? {
            router: {
              basepath: githubPagesRouterBasePath,
            },

            spa: {
              enabled: true,
              prerender: {
                outputPath: "/_shell.html",
                crawlLinks: true,
              },
            },

            prerender: {
              enabled: true,
              crawlLinks: true,
              failOnError: false,
            },

            sitemap: {
              enabled: true,
              host: `https://moritzbrantner.github.io${githubPagesBasePath === "/" ? "" : githubPagesBasePath}`,
            },

            // important: explicit locale pages
            pages: [
              {
                path: "/",
                prerender: { enabled: true },
              },
              {
                path: "/en",
                prerender: { enabled: true },
              },
              {
                path: "/de",
                prerender: { enabled: true },
              },
            ],
          }
        : {
            spa: {
              enabled: true,
              prerender: {
                outputPath: "/_shell.html",
                crawlLinks: true,
              },
            },

            prerender: {
              enabled: true,
              crawlLinks: true,
              failOnError: false,
            },

            // important: explicit locale pages
            pages: [
              {
                path: "/",
                prerender: { enabled: true },
              },
              {
                path: "/en",
                prerender: { enabled: true },
              },
              {
                path: "/de",
                prerender: { enabled: true },
              },
            ],
          },
    ),
    viteReact(),
  ],
});
