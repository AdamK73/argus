import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.tsx"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  sourcemap: false,
  minify: false,
  clean: true,
  dts: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
  outExtension() {
    return { js: ".js" };
  },
});
