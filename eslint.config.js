// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*"],
  },
  {
    // Enum pattern bắt buộc của dự án (.claude/rules/tech/mobile.md): `as const`
    // object + type alias TRÙNG TÊN. no-redeclare hiểu nhầm là khai báo trùng —
    // false positive trên mọi enum, không sửa được nếu vẫn theo rule dự án.
    files: ["src/**/*.enum.ts", "src/**/enums/*.ts"],
    rules: { "@typescript-eslint/no-redeclare": "off" },
  },
  {
    // types/*.ts re-export enum bằng `export ... from` rồi mới import type —
    // cố ý, để enum dùng được cả làm value lẫn type từ một chỗ.
    files: ["src/**/types/*.types.ts"],
    rules: { "import/first": "off" },
  },
]);
