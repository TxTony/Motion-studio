import { defineConfig } from "vite";

export default defineConfig({
  base: "/Motion-studio/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: { three: ["three"], vision: ["@mediapipe/tasks-vision"] },
      },
    },
  },
});
