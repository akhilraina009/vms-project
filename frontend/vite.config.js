import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vite";

const demoRedirectPlugin = () => ({
  name: "demo-redirect-plugin",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ? req.url.split("?")[0] : "";
      if (
        url === "/demo" ||
        url === "/demo/" ||
        url === "/demo-video" ||
        url === "/showcase" ||
        url === "/promo" ||
        url === "/tour" ||
        url === "/launch" ||
        url === "/vms-os" ||
        url === "/profile/vms-os" ||
        url === "/profile/vms-os/"
      ) {
        res.writeHead(302, { Location: "/profile/vms-os/index.html" });
        res.end();
        return;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), basicSsl(), demoRedirectPlugin()],
  server: {
    host: "0.0.0.0",
    https: true,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      "/auth": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/visits": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/visitors": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/pre-approvals": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/assets": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/public-registration": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/hosts": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/employees": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/audit-logs": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/notifications": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
