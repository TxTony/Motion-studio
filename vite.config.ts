/** Configures Vue compilation and engine chunks while preserving the Pages base path. */
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: { environment: "node" },
  base: "/Motion-studio/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: { three: ["three"], vision: ["@mediapipe/tasks-vision"] },
      },
    },
  },
});
