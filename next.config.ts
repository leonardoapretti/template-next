import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
  }).stdout || randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    {
      url: "/~offline",
      revision,
    },
  ],
  disable: process.env.NODE_ENV === "development",
});
const withMDX = createMDX({
  configPath: "source.config.ts",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
};

export default withSerwist(withMDX(nextConfig));
