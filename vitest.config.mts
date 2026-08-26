import { defineConfig } from "vitest/config";

// Môi trường `node`, không phải jsdom: bộ test này nhắm vào tầng logic thuần (định dạng
// ngày, phân quyền, giải mã token, phân loại ngưỡng môi trường) — phần chạy giống hệt nhau
// trên iOS, Android và trong Node. Dựng cây React Native cần Metro cùng bộ preset riêng,
// đắt hơn nhiều và không kiểm được gì thêm cho những hàm này.
export default defineConfig({
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname.replace(/\/$/, ""),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
  },
});
