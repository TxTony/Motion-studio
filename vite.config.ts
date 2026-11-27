/** Configure la compilation Vue et les chunks moteur sans changer la base Pages. */
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
