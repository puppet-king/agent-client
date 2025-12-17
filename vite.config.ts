import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"
import { resolve } from "path"

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // prevent vite from obscuring rust errors
  clearScreen: false,
  server: {
    // make sure this port matches the devUrl port in tauri.conf.json5 file
    port: 5173,
    // Tauri expects a fixed port, fail if that port is not available
    strictPort: true,
    // if the host Tauri is expecting is set, use it
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,

    watch: {
      // tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  // Env variables starting with the item of `envPrefix` will be exposed in tauri's source code through `import.meta.env`.
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target:
      process.env.TAURI_ENV_PLATFORM == "windows" ? "chrome105" : "safari13",
    // don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? "terser" : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    terserOptions: !process.env.TAURI_ENV_DEBUG
      ? {
          compress: {
            pure_funcs: [
              "console.log",
              "console.group",
              "console.groupEnd",
              "console.debug",
            ],
            drop_debugger: true, // 删除 debugger
          },
          format: {
            comments: false,
          },
          mangle: true, // 混淆变量
        }
      : {
          compress: {
            // 测试环境不删除任何 console
            drop_debugger: false,
          },
        },
  },
  // 解决 crypto 问题的配置
  define: {
    global: "globalThis",
    "import.meta.env.VITE_BUILD_PLATFORM": JSON.stringify(
      process.platform === "win32"
        ? "Windows"
        : process.platform === "darwin"
          ? "macOS"
          : "Linux",
    ),
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
})
