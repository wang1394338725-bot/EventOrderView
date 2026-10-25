import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 开发期跨域解法：把 /api、/image 转发到后端 8080，浏览器只见同源请求
      '/api': 'http://localhost:8080',
      '/image': 'http://localhost:8080',
    },
  },
})
