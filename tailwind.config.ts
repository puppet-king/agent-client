import type { Config } from "tailwindcss"

export default <Config>{
  content: ["./index.html", "./src/**/*.{html,js,ts,jsx,tsx,vue}"],
  theme: {
    extend: {},
  },
  plugins: [
    // 支持不完全
    // iconsPlugin({
    //   // 在这里可以选择你要使用的 icon, 更多详见:
    //   // https://icon-sets.iconify.design/
    //   collections: getIconCollections(['material-symbols', 'solar', 'mdi','jam']),
    //   // 禁用自动设置图标的 width 和 height
    //   autoWidth: false,
    //   autoHeight: false
    // }),
  ],
}
