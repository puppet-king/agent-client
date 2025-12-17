module.exports = {
  root: true,
  env: {
    node: true, // Node.js 环境（module/exports 等）
  },
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: 2024,
    sourceType: "module",
  },
  plugins: ["vue", "@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended", // Vue 3 推荐规则
    "plugin:@typescript-eslint/recommended", // TS 推荐规则
    "plugin:prettier/recommended", // Prettier 推荐规则
  ],
  rules: {
    "prettier/prettier": ["error", { semi: false }],
    semi: ["error", "never"],
  },
}
