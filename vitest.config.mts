import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Same "@/..." paths as tsconfig.json.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only" throws when imported outside Next.js's server bundle.
      // Tests run server code directly, so swap it for an empty module.
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
