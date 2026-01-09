import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: `${path.resolve(__dirname, ".")}/`,
      },
    ],
  },
  server: {
    // Enable HMR (Hot Module Replacement) for auto-reload
    hmr: {
      // HMR is enabled by default, but you can configure the port if needed
      // port: 5173, // Uncomment and set if you need a specific port
    },
    // Configure file watching for auto-reload
    watch: {
      // Use polling if file watching doesn't work (useful in Docker, WSL, or network filesystems)
      // usePolling: true, // Uncomment if you experience issues with file watching
    },
  },
});
