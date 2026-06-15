import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  exports: {
    devExports: true
  },
  deps: {
    skipNodeModulesBundle: true
  },
  publint: true,
  minify: "dce-only"
});
